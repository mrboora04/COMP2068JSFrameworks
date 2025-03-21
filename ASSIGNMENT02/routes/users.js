const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

// Login Page
router.get('/login', (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => res.render('register'));

// Register Handler
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/users/register');
    }
    user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10)
    });
    await user.save();
    req.flash('success_msg', 'You are now registered! Please log in.');
    res.redirect('/users/login');
  } catch (err) {
    console.error(err);
    res.redirect('/users/register');
  }
});

// Login Handler
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/users/login',
  failureFlash: true
}));

// Logout Handler
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;