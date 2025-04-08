const express = require('express');
const router = express.Router();
const Assignment = require('../models/assignment');

// Homepage route - renders the welcome page
router.get('/', (req, res) => {
  res.render('index', { title: 'Coding Assignment Tracker' });
});

// Calendar route - displays user's assignments with upcoming deadlines
router.get('/calendar', async (req, res, next) => {
  if (!req.user) return res.redirect('/login');
  try {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingAssignments = await Assignment.find({
      user: req.user.id,
      dueDate: { $gte: now, $lte: nextWeek }
    }).sort({ dueDate: 1 });
    const allAssignments = await Assignment.find({ user: req.user.id });
    res.render('calendar', { upcomingAssignments, allAssignments });
  } catch (err) {
    next(err);
  }
});

// Public route - displays all assignments
router.get('/public', async (req, res, next) => {
  try {
    const assignments = await Assignment.find();
    res.render('public', { assignments, title: 'Public Assignments' });
  } catch (err) {
    next(err);
  }
});

// Add to-do to an assignment in the calendar
router.post('/calendar/:id/add-todo', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (assignment.user.toString() !== req.user.id) return res.status(403).send('Unauthorized');
    assignment.todos.push({ task: req.body.task });
    await assignment.save();
    res.redirect('/calendar');
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;