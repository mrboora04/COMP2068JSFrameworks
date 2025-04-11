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
const exphbs = require('express-handlebars');

// Import models and routes
const Assignment = require('./models/assignment');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/user');
const assignmentsRouter = require('./routes/assignment');

// Initialize Express app
const app = express();

// Configure Passport
require('./config/passport')(passport);

// Register Handlebars with helpers
const hbs = exphbs.create({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  helpers: {
    formatDate: function (date, format) {
      if (!date) return 'N/A';
      const d = new Date(date);
      if (format === 'YYYY-MM-DD') {
        return d.toISOString().split('T')[0];
      }
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    eq: function (a, b) {
      return a === b;
    },
    urgencyClass: function (dueDate) {
      if (!dueDate) return 'bg-success text-white'; // Default class
      const now = new Date();
      const due = new Date(dueDate);
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 2) return 'bg-danger text-white';
      if (diffDays <= 5) return 'bg-warning';
      return 'bg-success text-white';
    },
    daysUntilDue: function (dueDate) {
      if (!dueDate) return 'N/A';
      const now = new Date();
      const due = new Date(dueDate);
      return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    }
  }
});

// Set Handlebars as the view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  res.locals.githubUsername = process.env.GITHUB_USERNAME;
  res.locals.dbConnected = mongoose.connection.readyState === 1;
  next();
});

// Routes
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

// Connect to MongoDB
mongoose.set('strictQuery', false);
const connectDB = require('./config/db');
connectDB().then(() => {
  console.log('Database connected successfully');
}).catch(err => {
  console.error('MongoDB failed to connect, running in limited mode:', err);
});

// Email reminders setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmailReminders() {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const assignments = await Assignment.find({
      dueDate: { $gte: now, $lte: tomorrow },
      completed: false,
      notify: true
    }).populate('user');

    for (const assignment of assignments) {
      if (assignment.user && assignment.user.email) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: assignment.user.email,
          subject: `Reminder: Assignment "${assignment.title}" Due Soon`,
          text: `Your assignment "${assignment.title}" is due on ${new Date(assignment.dueDate).toLocaleDateString()}. Don't forget to complete it!`
        };
        await transporter.sendMail(mailOptions);
        console.log(`Reminder sent for assignment: ${assignment.title}`);
      }
    }
  } catch (err) {
    console.error('Error sending email reminders:', err);
  }
}

// Schedule email reminders
setInterval(sendEmailReminders, 60 * 60 * 1000); // every hour

module.exports = app;
