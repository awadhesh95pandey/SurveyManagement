const express = require('express');
const { 
  sendSurveyNotifications,
  getSurveyNotifications,
  getUserNotifications,
  markNotificationRead,
  deleteNotification,
  markAllAsRead
} = require('../controllers/notification.controller');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// Check if this route has surveyId param (mounted from survey routes)
// If surveyId exists, these are survey-specific routes (admin only)
// If no surveyId, these are user notification routes

// Survey notification routes (when mounted with surveyId param)
router.route('/')
  .get(protect, (req, res, next) => {
    // If surveyId param exists, this is a survey notification request (admin only)
    if (req.params.surveyId) {
      return authorize('admin')(req, res, () => getSurveyNotifications(req, res, next));
    }
    // Otherwise, this is a user notification request
    return getUserNotifications(req, res, next);
  });

router.route('/send')
  .post(protect, authorize('admin'), sendSurveyNotifications);

router.route('/mark-all-read')
  .put(protect, markAllAsRead);

router.route('/:id/read')
  .put(protect, markNotificationRead);

router.route('/:id')
  .delete(protect, deleteNotification);

module.exports = router;
