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
mongoose.set('strictQuery', false); // Suppress strictQuery deprecation warning
const transporter = require('./config/email');

// Import routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/user');
const assignmentsRouter = require('./routes/assignment');

const app = express();

// Configure Passport for GitHub OAuth
require('./config/passport')(passport);

// Set up Handlebars view engine
const hbs = require('hbs');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Handlebars helpers
hbs.registerHelper('formatDate', function(date, format) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (format === 'YYYY-MM-DD') {
    return d.toISOString().split('T')[0];
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
});
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});
hbs.registerHelper('urgencyClass', function(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 2) return 'urgent';
  if (diffDays <= 5) return 'warning';
  return 'safe';
});
hbs.registerHelper('daysUntilDue', function(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
});

// Middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables for templates
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  res.locals.githubUsername = process.env.GITHUB_USERNAME;
  res.locals.dbConnected = mongoose.connection.readyState === 1;
  next();
});

// Define routes
app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/', assignmentsRouter);

// 404 error handler
app.use((req, res, next) => {
  next(createError(404));
});

// General error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Connect to MongoDB and set up email reminders
const connectDB = require('./config/db');
connectDB().then(() => {
  console.log('Database connected successfully');
  setInterval(async () => {
    if (mongoose.connection.readyState !== 1) return;
    try {
      const Assignment = require('./models/assignment');
      const assignments = await Assignment.find({
        dueDate: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        notified: { $ne: true },
        completed: false // Only notify for incomplete assignments
      });
      for (const assignment of assignments) {
        const user = await require('./models/user').findById(assignment.user);
        if (!user) continue;
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Reminder: ${assignment.title} Due Soon!`,
          text: `Weight: ${assignment.weight}%. Due on ${new Date(assignment.dueDate).toLocaleDateString()}. Priority: ${assignment.priority}.`
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

module.exports = app;