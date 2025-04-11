const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  category: { type: String },
  weight: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  notify: { type: Boolean, default: true },
  customMessage: { type: String },
  course: { type: String }
});

module.exports = mongoose.model('Assignment', assignmentSchema);