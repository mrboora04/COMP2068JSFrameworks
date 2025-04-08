const express = require('express');
const router = express.Router();
const passport = require('passport');

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// GitHub OAuth login
router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

// GitHub OAuth callback
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/dashboard');
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send('Logout Error');
    req.session.destroy();
    res.redirect('/');
  });
});

module.exports = router;