const express = require('express');
const { 
  startSurveyAttempt,
  submitResponse,
  completeSurveyAttempt,
  getSurveyResponses,
  getUserResponses,
  getSurveyParticipation
} = require('../controllers/response.controller');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('admin'), getSurveyResponses)
  .post(protect, submitResponse);

router.route('/attempt')
  .post(protect, startSurveyAttempt);

router.route('/attempt/:attemptId/complete')
  .put(protect, completeSurveyAttempt);

router.route('/user/:userId')
  .get(protect, getUserResponses);

router.route('/participation')
  .get(protect, authorize('admin'), getSurveyParticipation);

// Public routes for survey taking (no authentication required)
router.route('/public')
  .post(submitResponse); // Allow public response submission

router.route('/public/attempt')
  .post(startSurveyAttempt); // Allow public survey attempt start

router.route('/public/attempt/:attemptId/complete')
  .put(completeSurveyAttempt); // Allow public survey attempt completion

module.exports = router;
