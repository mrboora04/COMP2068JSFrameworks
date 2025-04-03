require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const hbs = require('hbs');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const assignmentsRouter = require('./routes/Assignment');

const app = express();

require('./config/passport')(passport);

// Register Handlebars helper for date formatting
hbs.registerHelper('formatDate', function(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  res.locals.githubUsername = process.env.GITHUB_USERNAME;
  res.locals.dbConnected = mongoose.connection.readyState === 1;
  next();
});

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/', assignmentsRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

require('./config/db').then(() => {
  setInterval(async () => {
    if (mongoose.connection.readyState !== 1) return;
    try {
      const Assignment = require('./models/assignment');
      const assignments = await Assignment.find({ dueDate: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) }, notified: { $ne: true } });
      for (const assignment of assignments) {
        const user = await require('./models/User').findById(assignment.user);
        if (!user) continue;
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Reminder: ${assignment.title} Due Soon!`,
          text: `Progress: ${assignment.progress}%. Due on ${new Date(assignment.dueDate).toLocaleDateString()}. Priority: ${assignment.priority}.`
        });
        assignment.notified = true;
        await assignment.save();
      }
    } catch (err) {
      console.error('Email reminder error:', err);
    }
  }, 60 * 60 * 1000);
}).catch(err => {
  console.error('MongoDB failed to connect, running in limited mode:', err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;