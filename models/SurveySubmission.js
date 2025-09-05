const mongoose = require('mongoose');

const SurveySubmissionSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Survey',
    required: [true, 'Please provide a survey ID']
  },
  employeeId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please provide an employee ID']
  },
  surveyTokenId: {
    type: mongoose.Schema.ObjectId,
    ref: 'SurveyToken',
    required: [true, 'Please provide a survey token ID']
  },
  // Response tracking
  totalQuestions: {
    type: Number,
    required: true
  },
  answeredQuestions: {
    type: Number,
    required: true
  },
  isComplete: {
    type: Boolean,
    default: true
  },
  // Submission metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  // Response IDs for reference
  responseIds: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Response'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one submission per employee per survey
SurveySubmissionSchema.index({ surveyId: 1, employeeId: 1 }, { unique: true });

// Index for efficient querying
SurveySubmissionSchema.index({ surveyTokenId: 1 }, { unique: true });
SurveySubmissionSchema.index({ submittedAt: -1 });

// Virtual to calculate completion percentage
SurveySubmissionSchema.virtual('completionPercentage').get(function() {
  if (this.totalQuestions === 0) return 0;
  return Math.round((this.answeredQuestions / this.totalQuestions) * 100);
});

// Static method to check if employee has already submitted survey
SurveySubmissionSchema.statics.hasEmployeeSubmitted = async function(surveyId, employeeId) {
  const submission = await this.findOne({ surveyId, employeeId });
  return !!submission;
};

// Static method to get survey submission statistics
SurveySubmissionSchema.statics.getSurveySubmissionStats = async function(surveyId) {
  const stats = await this.aggregate([
    { $match: { surveyId: mongoose.Types.ObjectId(surveyId) } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        completeSubmissions: {
          $sum: { $cond: [{ $eq: ['$isComplete', true] }, 1, 0] }
        },
        averageCompletion: { $avg: '$completionPercentage' },
        totalQuestionsAnswered: { $sum: '$answeredQuestions' },
        firstSubmission: { $min: '$submittedAt' },
        lastSubmission: { $max: '$submittedAt' }
      }
    }
  ]);

  return stats[0] || {
    totalSubmissions: 0,
    completeSubmissions: 0,
    averageCompletion: 0,
    totalQuestionsAnswered: 0,
    firstSubmission: null,
    lastSubmission: null
  };
};

module.exports = mongoose.model('SurveySubmission', SurveySubmissionSchema);
