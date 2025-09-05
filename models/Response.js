const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Survey',
    required: [true, 'Please provide a survey ID']
  },
  questionId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Question',
    required: [true, 'Please provide a question ID']
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null // null for anonymous responses
  },
  selectedOption: {
    type: String,
    required: [true, 'Please provide a selected option'],
    trim: true
  },
  // For tracking anonymous responses (without revealing user identity)
  anonymousId: {
    type: String,
    default: null
  },
  // For token-based responses
  surveyTokenId: {
    type: mongoose.Schema.ObjectId,
    ref: 'SurveyToken',
    default: null
  },
  // Metadata
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
  // Flag to indicate if this response was submitted with user consent
  hasConsent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate anonymous ID for responses without user consent
ResponseSchema.pre('save', function(next) {
  if (!this.userId && !this.anonymousId) {
    this.anonymousId = require('crypto').randomBytes(16).toString('hex');
  }
  next();
});

// Index for efficient querying
ResponseSchema.index({ surveyId: 1, questionId: 1 });
ResponseSchema.index({ userId: 1, surveyId: 1 });
ResponseSchema.index({ anonymousId: 1 });

// Compound index to prevent duplicate responses from same user for same question
ResponseSchema.index({ surveyId: 1, questionId: 1, userId: 1 }, { 
  unique: true,
  partialFilterExpression: { userId: { $ne: null } }
});

// Method to check if response is anonymous
ResponseSchema.methods.isAnonymous = function() {
  return !this.userId;
};

// Static method to get survey statistics
ResponseSchema.statics.getSurveyStats = async function(surveyId) {
  const stats = await this.aggregate([
    { $match: { surveyId: mongoose.Types.ObjectId(surveyId) } },
    {
      $group: {
        _id: null,
        totalResponses: { $sum: 1 },
        uniqueParticipants: { 
          $addToSet: { 
            $cond: [
              { $ne: ['$userId', null] },
              '$userId',
              '$anonymousId'
            ]
          }
        },
        consentedResponses: {
          $sum: { $cond: [{ $eq: ['$hasConsent', true] }, 1, 0] }
        },
        anonymousResponses: {
          $sum: { $cond: [{ $eq: ['$userId', null] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalResponses: 1,
        uniqueParticipants: { $size: '$uniqueParticipants' },
        consentedResponses: 1,
        anonymousResponses: 1
      }
    }
  ]);

  return stats[0] || {
    totalResponses: 0,
    uniqueParticipants: 0,
    consentedResponses: 0,
    anonymousResponses: 0
  };
};

module.exports = mongoose.model('Response', ResponseSchema);
