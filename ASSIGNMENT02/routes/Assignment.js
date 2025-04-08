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
    const query = req.query.search ? { user: req.user.id, title: { $regex: req.query.search, $options: 'i' } } : { user: req.user.id };
    const assignments = await Assignment.find(query);
    console.log(assignments); // Debug fetched assignments
    res.render('dashboard', { assignments });
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
    console.log(req.body); // Debug form data
    const assignment = new Assignment({
      user: req.user.id,
      title: req.body.title,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      category: req.body.category,
      weight: Number(req.body.weight) || 0, // Ensure weight is a number
      completed: req.body.completed === 'on' // Set completion status
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
    console.log(req.body); // Debug form data
    const assignment = await Assignment.findById(req.params.id);
    if (assignment.user.toString() !== req.user.id) return res.status(403).send('Unauthorized');
    assignment.title = req.body.title;
    assignment.dueDate = req.body.dueDate;
    assignment.priority = req.body.priority;
    assignment.category = req.body.category;
    assignment.weight = Number(req.body.weight) || 0; // Ensure weight is a number
    assignment.completed = req.body.completed === 'on'; // Update completion status
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
        { id: 'completed', title: 'Completed' }
      ]
    });
    await csvWriter.writeRecords(assignments.map(a => ({
      title: a.title,
      dueDate: new Date(a.dueDate).toLocaleDateString(),
      priority: a.priority,
      category: a.category,
      weight: a.weight,
      completed: a.completed ? 'Yes' : 'No'
    })));
    res.download('assignments.csv');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;