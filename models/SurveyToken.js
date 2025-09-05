const mongoose = require('mongoose');
const crypto = require('crypto');

const SurveyTokenSchema = new mongoose.Schema({
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
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  // Email tracking
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  // Usage tracking
  usedAt: {
    type: Date
  },
  responseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Response'
  },
  // Access tracking
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  // Expiration
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique token before saving
SurveyTokenSchema.pre('save', function(next) {
  if (!this.token) {
    // Generate a secure random token
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Compound index to ensure one token per employee per survey
SurveyTokenSchema.index({ surveyId: 1, employeeId: 1 }, { unique: true });

// Index for efficient token lookup
SurveyTokenSchema.index({ token: 1 });

// Index for cleanup of expired tokens
SurveyTokenSchema.index({ expiresAt: 1 });

// Virtual to check if token is expired
SurveyTokenSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt || this.status === 'expired';
});

// Virtual to check if token is usable
SurveyTokenSchema.virtual('isUsable').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// Method to mark token as used
SurveyTokenSchema.methods.markAsUsed = function(responseId) {
  this.status = 'used';
  this.usedAt = new Date();
  if (responseId) {
    this.responseId = responseId;
  }
  return this.save();
};

// Method to track access
SurveyTokenSchema.methods.trackAccess = function(ipAddress, userAgent) {
  this.accessCount += 1;
  this.lastAccessedAt = new Date();
  if (ipAddress) this.ipAddress = ipAddress;
  if (userAgent) this.userAgent = userAgent;
  return this.save();
};

// Method to mark email as sent
SurveyTokenSchema.methods.markEmailSent = function() {
  this.emailSent = true;
  this.emailSentAt = new Date();
  return this.save();
};

// Static method to generate tokens for survey employees
SurveyTokenSchema.statics.generateTokensForSurvey = async function(surveyId, employeeIds, expirationDays = 30) {
  const tokens = [];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  for (const employeeId of employeeIds) {
    try {
      // Check if token already exists for this employee-survey combination
      let existingToken = await this.findOne({ surveyId, employeeId });
      
      if (existingToken) {
        // If token exists but is expired/used, create a new one
        if (!existingToken.isUsable) {
          await this.deleteOne({ _id: existingToken._id });
          existingToken = null;
        }
      }

      if (!existingToken) {
        const token = new this({
          surveyId,
          employeeId,
          expiresAt
        });
        await token.save();
        tokens.push(token);
      } else {
        tokens.push(existingToken);
      }
    } catch (error) {
      console.error(`Error generating token for employee ${employeeId}:`, error);
    }
  }

  return tokens;
};

// Static method to get survey token statistics
SurveyTokenSchema.statics.getSurveyTokenStats = async function(surveyId) {
  const stats = await this.aggregate([
    { $match: { surveyId: mongoose.Types.ObjectId(surveyId) } },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: 1 },
        activeTokens: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        usedTokens: {
          $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] }
        },
        expiredTokens: {
          $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
        },
        emailsSent: {
          $sum: { $cond: [{ $eq: ['$emailSent', true] }, 1, 0] }
        },
        totalAccesses: { $sum: '$accessCount' }
      }
    },
    {
      $project: {
        _id: 0,
        totalTokens: 1,
        activeTokens: 1,
        usedTokens: 1,
        expiredTokens: 1,
        emailsSent: 1,
        totalAccesses: 1,
        responseRate: {
          $cond: [
            { $eq: ['$totalTokens', 0] },
            0,
            { $multiply: [{ $divide: ['$usedTokens', '$totalTokens'] }, 100] }
          ]
        }
      }
    }
  ]);

  return stats[0] || {
    totalTokens: 0,
    activeTokens: 0,
    usedTokens: 0,
    expiredTokens: 0,
    emailsSent: 0,
    totalAccesses: 0,
    responseRate: 0
  };
};

// Static method to cleanup expired tokens
SurveyTokenSchema.statics.cleanupExpiredTokens = async function() {
  const result = await this.updateMany(
    { 
      expiresAt: { $lt: new Date() },
      status: 'active'
    },
    { 
      status: 'expired'
    }
  );
  
  return result.modifiedCount;
};

module.exports = mongoose.model('SurveyToken', SurveyTokenSchema);
