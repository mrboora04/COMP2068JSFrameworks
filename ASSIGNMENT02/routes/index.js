const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Coding Assignment Tracker' });
});

router.get('/calendar', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const assignments = await require('../models/assignment').find({ user: req.user.id });
  res.render('calendar', { assignments });
});

module.exports = router;