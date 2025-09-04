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

module.exports = router;

