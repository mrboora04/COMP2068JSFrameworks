const express = require('express');
const router = express.Router();

// Home Page
router.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

// Projects Page
router.get('/projects', (req, res) => {
  res.render('projects', { title: 'Projects' });
});

module.exports = router;