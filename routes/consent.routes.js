const express = require('express');
const { 
  recordConsent,
  verifyConsentToken,
  getSurveyConsentStatus,
  checkUserConsent
} = require('../controllers/consent.controller');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// Publish routes (no auth required)
router.route('/:token')
  .post(recordConsent);

router.route('/:token/verify')
  .get(verifyConsentToken);

// Protected routes
router.route('/')
  .get(protect, authorize('admin'), getSurveyConsentStatus);

router.route('/check')
  .get(protect, checkUserConsent);

module.exports = router;

