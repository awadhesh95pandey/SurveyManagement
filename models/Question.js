const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Survey',
    required: [true, 'Please provide a survey ID']
  },
  questionText: {
    type: String,
    required: [true, 'Please provide question text'],
    trim: true,
    maxlength: [1000, 'Question text cannot be more than 1000 characters']
  },
  options: [{
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Option cannot be more than 200 characters']
  }],
  parameter: {
    type: String,
    trim: true,
    maxlength: [100, 'Parameter cannot be more than 100 characters']
  },
  questionOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Validation for options array
QuestionSchema.path('options').validate(function(options) {
  return options && options.length >= 2 && options.length <= 4;
}, 'Question must have between 2 and 4 options');

// Update the updatedAt field before saving
QuestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
QuestionSchema.index({ surveyId: 1, questionOrder: 1 });

module.exports = mongoose.model('Question', QuestionSchema);

