const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Login Page (GET)
router.get('/login', (req, res) => {
  res.render('login');
});

// Register Page (GET)
router.get('/register', (req, res) => {
  res.render('register');
});

// Register Handler (POST)
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/users/register');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword
    });
    await newUser.save();
    req.flash('success_msg', 'You are now registered! Please log in.');
    res.redirect('/users/login');
  } catch (error) {
    console.error('Registration error:', error);
    res.redirect('/users/register');
  }
});

// Login Handler (POST)
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/users/login',
  failureFlash: true
}));

// Logout Handler (GET)
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

module.exports = router;