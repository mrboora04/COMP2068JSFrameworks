const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String }
});

module.exports = mongoose.model('User', userSchema);