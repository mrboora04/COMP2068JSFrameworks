const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/user');

// Configure GitHub OAuth strategy
module.exports = function(passport) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:8080/auth/github/callback' // Update to Render URL after deployment
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      if (user) return done(null, user);
      user = new User({
        githubId: profile.id,
        username: profile.username,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : ''
      });
      await user.save();
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // Serialize user into the session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};