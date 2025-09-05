const express = require('express');
const router = express.Router();
const {
  generateSurveyTokens,
  getSurveyTokens,
  validateSurveyToken,
  revokeSurveyToken
} = require('../controllers/surveyToken.controller');

const {
  startSurveyAttemptWithToken,
  submitSurveyResponsesWithToken
} = require('../controllers/response.controller');

const { protect } = require('../middleware/auth');

// Token management routes (protected)
router.post('/:surveyId/tokens/generate', protect, generateSurveyTokens);
router.get('/:surveyId/tokens', protect, getSurveyTokens);
router.delete('/:surveyId/tokens/:tokenId', protect, revokeSurveyToken);

// Public token validation and survey routes
router.get('/:surveyId/tokens/:tokenId/validate', validateSurveyToken);
router.post('/:surveyId/:tokenId/attempt', startSurveyAttemptWithToken);
router.post('/:surveyId/:tokenId/responses/submit', submitSurveyResponsesWithToken);

module.exports = router;

