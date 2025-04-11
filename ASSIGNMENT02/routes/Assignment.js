const express = require('express');
const router = express.Router();
const Assignment = require('../models/assignment');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


function ensureAuthenticated(req, res, next) {
  if (req.user) return next();
  res.redirect('/login');
}

function groupByCourse(assignments) {
  return assignments.reduce((acc, assignment) => {
    const course = assignment.course || 'General';
    if (!acc[course]) acc[course] = [];
    acc[course].push(assignment);
    return acc;
  }, {});
}

function formatAssignments(groupedAssignments) {
  return Object.keys(groupedAssignments).map(course => ({
    course,
    assignments: groupedAssignments[course],
    isMultiple: groupedAssignments[course].length > 1
  }));
}

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const allAssignments = await Assignment.find({ user: req.user.id }).lean();
    const incompleteAssignments = allAssignments.filter(a => !a.completed);
    const completedAssignments = allAssignments.filter(a => a.completed);

    const groupedIncomplete = groupByCourse(incompleteAssignments);
    const groupedCompleted = groupByCourse(completedAssignments);

    const formattedIncomplete = formatAssignments(groupedIncomplete);
    const formattedCompleted = formatAssignments(groupedCompleted);

    res.render('dashboard', { incomplete: formattedIncomplete, completed: formattedCompleted });
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/calender', ensureAuthenticated, async (req, res) => {
  try {
    const allAssignments = await Assignment.find({ user: req.user.id }).lean();
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const upcoming = allAssignments.filter(a => {
      const due = new Date(a.dueDate);
      return due >= today && due <= nextWeek && !a.completed;
    });

    const groupedUpcoming = groupByCourse(upcoming);
    const groupedAll = groupByCourse(allAssignments);

    const formattedUpcoming = formatAssignments(groupedUpcoming);
    const formattedAll = formatAssignments(groupedAll);

    res.render('calender', { upcomingAssignments: formattedUpcoming, allAssignments: formattedAll });
  } catch (err) {
    console.error('Error loading calendar:', err);
    res.status(500).send('Server Error');
  }
});

router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('add');
});

router.post('/add', ensureAuthenticated, async (req, res) => {
  try {
    const { title, course, dueDate, priority, category, weight, completed, notify, customMessage } = req.body;

    const newAssignment = new Assignment({
      user: req.user.id,
      title,
      course,
      dueDate,
      priority,
      category,
      weight: weight || 0,
      completed: completed === 'on',
      notify: notify === 'on',
      customMessage
    });

    await newAssignment.save();
    req.flash('success_msg', 'Assignment added successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error adding assignment:', err);
    req.flash('error_msg', 'Failed to add assignment');
    res.redirect('/add');
  }
});

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

router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
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
    res.redirect('/calender');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

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

router.get('/assignments', (req, res) => {
  res.send('Assignments route placeholder');
});

module.exports = router;