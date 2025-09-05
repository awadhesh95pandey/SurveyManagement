const express = require('express');
const { 
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  uploadQuestions,
  downloadSampleTemplate
} = require('../controllers/question.controller');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getQuestions)
  .post(protect, authorize('admin'), createQuestion);

// Public route for getting questions when taking a survey
router.route('/public')
  .get(getQuestions); // Allow public access to questions for survey taking

router.route('/upload')
  .post(protect, authorize('admin'), uploadQuestions);

router.route('/sample-template')
  .get(protect, downloadSampleTemplate);

router.route('/:id')
  .get(protect, getQuestion)
  .put(protect, authorize('admin'), updateQuestion)
  .delete(protect, authorize('admin'), deleteQuestion);

module.exports = router;
