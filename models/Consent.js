const mongoose = require('mongoose');

const ConsentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user ID']
  },
  surveyId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Survey',
    required: [true, 'Please provide a survey ID']
  },
  consentGiven: {
    type: Boolean,
    default: null // null = pending, true = consented, false = declined
  },
  consentTimestamp: {
    type: Date,
    default: null
  },
  consentToken: {
    type: String,
    unique: true,
    required: true
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
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

// Generate consent token before saving
ConsentSchema.pre('save', function(next) {
  if (!this.consentToken) {
    this.consentToken = require('crypto').randomBytes(32).toString('hex');
  }
  this.updatedAt = Date.now();
  next();
});

// Update consent timestamp when consent is given/declined
ConsentSchema.pre('save', function(next) {
  if (this.isModified('consentGiven') && this.consentGiven !== null) {
    this.consentTimestamp = new Date();
  }
  next();
});

// Compound index to ensure one consent record per user per survey
ConsentSchema.index({ userId: 1, surveyId: 1 }, { unique: true });

// Index for efficient token lookup
ConsentSchema.index({ consentToken: 1 });

// Method to check if consent is still valid (before survey publish date)
ConsentSchema.methods.isConsentPeriodValid = async function() {
  const Survey = mongoose.model('Survey');
  const survey = await Survey.findById(this.surveyId);
  
  if (!survey) return false;
  
  const now = new Date();
  const publishDate = new Date(survey.publishDate);
  
  return now < publishDate;
};

module.exports = mongoose.model('Consent', ConsentSchema);

