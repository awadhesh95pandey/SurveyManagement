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
    required: true
  },
  type: {
    type: String,
    enum: ['consent_request', 'survey_available', 'manager_notification', 'reportee_notification'],
    required: true
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
});

// Create indexes for common queries
NotificationSchema.index({ userId: 1, surveyId: 1, type: 1 });
NotificationSchema.index({ surveyId: 1, type: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);

