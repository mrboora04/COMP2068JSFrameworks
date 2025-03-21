const express = require('express');
const router = express.Router();
const Assignment = require('models/Assignment');

router.get('/', (req, res) => {
  res.render('index', { title: 'Coding Assignment Tracker' });
});

router.get('/assignments', async (req, res) => {
  const assignments = await Assignment.find().select('title dueDate priority');
  res.render('assignments', { assignments });
});

module.exports = router;