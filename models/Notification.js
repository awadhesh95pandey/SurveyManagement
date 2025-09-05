const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: false
  },
  type: {
    type: String,
    enum: ['consent_request', 'survey_available', 'survey_invitation', 'manager_notification', 'reportee_notification', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  sent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: null
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered', 'opened'],
    default: 'pending'
  },
  relatedToUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Create indexes for common queries
NotificationSchema.index({ userId: 1, surveyId: 1, type: 1 });
NotificationSchema.index({ surveyId: 1, type: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
