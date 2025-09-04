const mongoose = require('mongoose');

const SurveyAttemptSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  },
  anonymous: {
    type: Boolean,
    default: false
  }
});

// Create indexes for common queries
SurveyAttemptSchema.index({ surveyId: 1 });
SurveyAttemptSchema.index({ userId: 1, surveyId: 1 });
SurveyAttemptSchema.index({ surveyId: 1, completed: 1 });

module.exports = mongoose.model('SurveyAttempt', SurveyAttemptSchema);

