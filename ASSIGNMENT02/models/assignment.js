const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Assignment schema
const AssignmentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  category: { type: String, enum: ['Coding', 'Math', 'Writing', 'Other'], default: 'Coding' },
  weight: { type: Number, min: 0, max: 100, default: 0 }, // Renamed from progress
  notified: { type: Boolean, default: false },
  todos: [{ task: String, completed: { type: Boolean, default: false } }],
  completed: { type: Boolean, default: false } // Tracks if assignment is complete
});

module.exports = mongoose.model('Assignment', AssignmentSchema);