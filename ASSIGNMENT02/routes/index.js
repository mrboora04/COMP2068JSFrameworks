const express = require('express');
const router = express.Router();
const Assignment = require('../models/assignment');

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/calendar', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingAssignments = await Assignment.find({
      user: req.user.id,
      dueDate: { $gte: today, $lte: nextWeek },
      completed: false
    }).sort({ dueDate: 1 });

    const allAssignments = await Assignment.find({ user: req.user.id }).sort({ dueDate: 1 });

    const groupedUpcoming = {};
    upcomingAssignments.forEach(a => {
      const course = a.course || 'General';
      if (!groupedUpcoming[course]) groupedUpcoming[course] = [];
      groupedUpcoming[course].push(a);
    });

    const formattedUpcoming = Object.keys(groupedUpcoming).map(course => ({
      course,
      assignments: groupedUpcoming[course],
      isMultiple: groupedUpcoming[course].length > 1
    }));

    const groupedAll = {};
    allAssignments.forEach(a => {
      const course = a.course || 'General';
      if (!groupedAll[course]) groupedAll[course] = [];
      groupedAll[course].push(a);
    });

    const formattedAll = Object.keys(groupedAll).map(course => ({
      course,
      assignments: groupedAll[course],
      isMultiple: groupedAll[course].length > 1
    }));

    res.render('calendar', { upcomingAssignments: formattedUpcoming, allAssignments: formattedAll });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;