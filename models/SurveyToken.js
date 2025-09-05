const mongoose = require('mongoose');

const SurveyTokenSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  tokenId: {
    type: String,
    required: true,
    trim: true
  },
  employeeEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  employeeName: {
    type: String,
    trim: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

// ✅ Compound index: ensures each survey+token pair is unique
SurveyTokenSchema.index({ surveyId: 1, tokenId: 1 }, { unique: true });

// ✅ Index for token lookup
SurveyTokenSchema.index({ tokenId: 1 });

// ✅ Index for employee lookup in a survey
SurveyTokenSchema.index({ surveyId: 1, employeeEmail: 1 });

// Method to mark token as used
SurveyTokenSchema.methods.markAsUsed = function () {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

// Static method to validate token
SurveyTokenSchema.statics.validateToken = async function (surveyId, tokenId) {
  const token = await this.findOne({
    surveyId: surveyId,
    tokenId: tokenId,
    isUsed: false
  });

  if (!token) {
    return { valid: false, message: 'Invalid or already used token' };
  }

  // Check if token has expired
  if (token.expiresAt && token.expiresAt < new Date()) {
    return { valid: false, message: 'Token has expired' };
  }

  return { valid: true, token };
};

module.exports = mongoose.model('SurveyToken', SurveyTokenSchema);