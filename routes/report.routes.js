const express = require('express');
const { 
  generateSurveyReport,
  generateUserReport,
  exportSurveyResults
} = require('../controllers/report.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/surveys/:surveyId')
  .get(protect, authorize('admin'), generateSurveyReport);

router.route('/surveys/:surveyId/export')
  .get(protect, authorize('admin'), exportSurveyResults);

router.route('/users/:userId/surveys/:surveyId')
  .get(protect, generateUserReport);

module.exports = router;

