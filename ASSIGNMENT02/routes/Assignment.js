const express = require('express');
const router = express.Router();
const Assignment = require('../models/assignment');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.user) return next();
  res.redirect('/login');
}

// Dashboard route - list user's assignments
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    console.log('Logged-in User ID:', req.user.id);
    const allAssignments = await Assignment.find({ user: req.user.id });
    console.log('All Assignments for User:', allAssignments);
    let debugMessage = allAssignments.length === 0 ? 'No assignments found for this user in the database.' : '';
    const incompleteAssignments = allAssignments.filter(a => !a.completed);
    const completedAssignments = allAssignments.filter(a => a.completed);
    console.log('Incomplete Assignments (completed: false):', incompleteAssignments);
    console.log('Completed Assignments (completed: true):', completedAssignments);

    const groupedIncomplete = {};
    incompleteAssignments.forEach(a => {
      const course = a.course || 'General';
      if (!groupedIncomplete[course]) {
        groupedIncomplete[course] = [];
      }
      groupedIncomplete[course].push(a);
    });

    const groupedCompleted = {};
    completedAssignments.forEach(a => {
      const course = a.course || 'General';
      if (!groupedCompleted[course]) {
        groupedCompleted[course] = [];
      }
      groupedCompleted[course].push(a);
    });

    const formattedIncomplete = Object.keys(groupedIncomplete).map(course => ({
      course,
      assignments: groupedIncomplete[course],
      isMultiple: groupedIncomplete[course].length > 1
    }));

    const formattedCompleted = Object.keys(groupedCompleted).map(course => ({
      course,
      assignments: groupedCompleted[course],
      isMultiple: groupedCompleted[course].length > 1
    }));

    res.render('dashboard', { incomplete: formattedIncomplete, completed: formattedCompleted, debugMessage });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Add assignment form
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('add');
});

// Add assignment
router.post('/add', ensureAuthenticated, async (req, res) => {
  try {
    console.log(req.body);
    const assignment = new Assignment({
      user: req.user.id,
      title: req.body.title,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      category: req.body.category,
      weight: Number(req.body.weight) || 0,
      completed: req.body.completed === 'on',
      notify: req.body.notify === 'on',
      customMessage: req.body.customMessage || '',
      course: req.body.course || 'General'
    });
    await assignment.save();
    req.flash('success_msg', 'Assignment added successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Edit assignment form
router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (assignment.user.toString() !== req.user.id) return res.status(403).send('Unauthorized');
    res.render('edit', { assignment });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update assignment
router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    console.log(req.body);
    const assignment = await Assignment.findById(req.params.id);
    if (assignment.user.toString() !== req.user.id) return res.status(403).send('Unauthorized');
    assignment.title = req.body.title;
    assignment.dueDate = req.body.dueDate;
    assignment.priority = req.body.priority;
    assignment.category = req.body.category;
    assignment.weight = Number(req.body.weight) || 0;
    assignment.completed = req.body.completed === 'on';
    assignment.notify = req.body.notify === 'on';
    assignment.customMessage = req.body.customMessage || '';
    assignment.course = req.body.course || 'General';
    await assignment.save();
    req.flash('success_msg', 'Assignment updated successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Delete assignment
router.get('/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (assignment.user.toString() !== req.user.id) return res.status(403).send('Unauthorized');
    await assignment.remove();
    req.flash('success_msg', 'Assignment deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Export assignments to CSV
router.get('/export', ensureAuthenticated, async (req, res) => {
  try {
    const assignments = await Assignment.find({ user: req.user.id });
    const csvWriter = createCsvWriter({
      path: 'assignments.csv',
      header: [
        { id: 'title', title: 'Title' },
        { id: 'dueDate', title: 'Due Date' },
        { id: 'priority', title: 'Priority' },
        { id: 'category', title: 'Category' },
        { id: 'weight', title: 'Weight' },
        { id: 'completed', title: 'Completed' },
        { id: 'notify', title: 'Notify' },
        { id: 'course', title: 'Course' }
      ]
    });
    await csvWriter.writeRecords(assignments.map(a => ({
      title: a.title,
      dueDate: new Date(a.dueDate).toLocaleDateString(),
      priority: a.priority,
      category: a.category,
      weight: a.weight,
      completed: a.completed ? 'Yes' : 'No',
      notify: a.notify ? 'Yes' : 'No',
      course: a.course
    })));
    res.download('assignments.csv');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Schedule route - plan assignments for the week
router.get('/schedule', ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const assignments = await Assignment.find({
      user: req.user.id,
      dueDate: { $gte: today, $lte: nextWeek },
      completed: false
    }).sort({ dueDate: 1 });
    res.render('schedule', { assignments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;