const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const transporter = require('../config/email');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error_msg', 'Please log in');
  res.redirect('/users/login');
}

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  const assignments = await Assignment.find({ user: req.user.id });
  res.render('dashboard', { assignments });
});

router.get('/add', ensureAuthenticated, (req, res) => res.render('add'));

router.post('/add', ensureAuthenticated, async (req, res) => {
  const { title, dueDate, priority } = req.body;
  const assignment = new Assignment({ user: req.user.id, title, dueDate, priority });
  await assignment.save();
  const timeToDue = new Date(dueDate) - new Date();
  if (timeToDue <= 24 * 60 * 60 * 1000) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: req.user.email,
      subject: `Reminder: ${title} Due Soon!`,
      text: `Due on ${dueDate}. Priority: ${priority}.`
    });
  }
  res.redirect('/dashboard');
});

router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (assignment.user.toString() !== req.user.id) return res.redirect('/dashboard');
  res.render('edit', { assignment });
});

router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
  await Assignment.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/dashboard');
});

router.get('/delete/:id', ensureAuthenticated, async (req, res) => {
  await Assignment.findByIdAndDelete(req.params.id);
  res.redirect('/dashboard');
});

module.exports = router;