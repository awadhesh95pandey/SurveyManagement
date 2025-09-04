const express = require('express');
const { 
  sendSurveyNotifications,
  getSurveyNotifications,
  getUserNotifications,
  markNotificationRead
} = require('../controllers/notification.controller');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// Routes for survey notifications (with surveyId)
router.route('/')
  .get(protect, authorize('admin'), getSurveyNotifications);

router.route('/send')
  .post(protect, authorize('admin'), sendSurveyNotifications);

// Routes for user notifications (without surveyId)
router.route('/')
  .get(protect, getUserNotifications);

router.route('/:id/read')
  .put(protect, markNotificationRead);

module.exports = router;

