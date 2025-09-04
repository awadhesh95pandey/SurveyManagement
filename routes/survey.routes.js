const express = require('express');
const { 
  createSurvey,
  getSurveys,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  getUpcomingSurveys,
  getActiveSurveys,
  updateSurveyStatus,
  generateConsentRecords,
  updateSurveyStatuses,
  getConsentStatus,
  getEmployees,
  getDepartments
} = require('../controllers/survey.controller');

// Include other resource routers
const questionRouter = require('./question.routes');
const consentRouter = require('./consent.routes');
const responseRouter = require('./response.routes');
const notificationRouter = require('./notification.routes');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:surveyId/questions', questionRouter);
router.use('/:surveyId/consent', consentRouter);
router.use('/:surveyId/responses', responseRouter);
router.use('/:surveyId/notifications', notificationRouter);

// Survey routes
router.route('/')
  .get(protect, getSurveys)
  .post(protect, authorize('admin'), createSurvey);

router.route('/upcoming')
  .get(protect, getUpcomingSurveys);

router.route('/active')
  .get(protect, getActiveSurveys);

router.route('/update-statuses')
  .get(protect, authorize('admin'), updateSurveyStatuses);

router.route('/:id')
  .get(protect, getSurvey)
  .put(protect, authorize('admin'), updateSurvey)
  .delete(protect, authorize('admin'), deleteSurvey);

router.route('/:id/status')
  .put(protect, authorize('admin'), updateSurveyStatus);

router.route('/:id/generate-consent')
  .post(protect, authorize('admin'), generateConsentRecords);

// Consent status for a survey (admin only)
router.route('/:id/consent/status')
  .get(protect, authorize('admin'), getConsentStatus);

module.exports = router;
