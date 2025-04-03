const express = require('express');
const router = express.Router();
const Assignment = require('../models/assignment');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error_msg', 'Please log in');
  res.redirect('/login');
}

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  if (!res.locals.dbConnected) return res.render('dashboard', { assignments: [] });
  try {
    let assignments = await Assignment.find({ user: req.user.id });
    // Format dueDate for each assignment
    assignments = assignments.map(assignment => {
      assignment.dueDateFormatted = assignment.dueDate
        ? new Date(assignment.dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : 'N/A';
      return assignment;
    });
    res.render('dashboard', { assignments });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error_msg', 'Database error');
    res.render('dashboard', { assignments: [] });
  }
});

router.get('/add', ensureAuthenticated, (req, res) => res.render('add'));

router.post('/add', ensureAuthenticated, async (req, res) => {
  if (!res.locals.dbConnected) {
    req.flash('error_msg', 'Database unavailable');
    return res.redirect('/add');
  }
  const { title, dueDate, priority, category, progress } = req.body;
  try {
    const assignment = new Assignment({ user: req.user.id, title, dueDate, priority, category, progress, notified: false });
    await assignment.save();
    req.flash('success_msg', 'Assignment added!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Add assignment error:', err);
    req.flash('error_msg', 'Failed to add assignment');
    res.redirect('/add');
  }
});

router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
  if (!res.locals.dbConnected) return res.redirect('/dashboard');
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || assignment.user.toString() !== req.user.id) {
      req.flash('error_msg', 'Assignment not found or unauthorized');
      return res.redirect('/dashboard');
    }
    res.render('edit', { assignment });
  } catch (err) {
    console.error('Edit error:', err);
    res.redirect('/dashboard');
  }
});

router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
  if (!res.locals.dbConnected) {
    req.flash('error_msg', 'Database unavailable');
    return res.redirect(`/edit/${req.params.id}`);
  }
  const { title, dueDate, priority, category, progress } = req.body;
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || assignment.user.toString() !== req.user.id) {
      req.flash('error_msg', 'Assignment not found or unauthorized');
      return res.redirect('/dashboard');
    }
    await Assignment.findByIdAndUpdate(req.params.id, { title, dueDate, priority, category, progress });
    req.flash('success_msg', 'Assignment updated!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Update error:', err);
    req.flash('error_msg', 'Failed to update assignment');
    res.redirect(`/edit/${req.params.id}`);
  }
});

router.post('/delete/:id', ensureAuthenticated, async (req, res) => {
  if (!res.locals.dbConnected) return res.redirect('/dashboard');
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment || assignment.user.toString() !== req.user.id) {
      req.flash('error_msg', 'Assignment not found or unauthorized');
      return res.redirect('/dashboard');
    }
    await Assignment.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Assignment deleted!');
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Delete error:', err);
    res.redirect('/dashboard');
  }
});

module.exports = router;