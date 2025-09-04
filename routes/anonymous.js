const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const Question = require('../models/Question');
const Response = require('../models/Response');
const Consent = require('../models/Consent');

// @desc    Get survey by anonymous token
// @route   GET /api/surveys/token/:token
// @access  Publish
router.get('/surveys/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find survey by anonymous token
    const survey = await Survey.findOne({ anonymousToken: token })
      .populate('createdBy', 'name email');

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found or invalid token'
      });
    }

    // Check if survey is accessible
    const now = new Date();
    const publishDate = new Date(survey.publishDate);
    const endDate = new Date(publishDate);
    endDate.setDate(endDate.getDate() + survey.noOfDays);

    if (now < publishDate) {
      return res.status(400).json({
        success: false,
        message: 'This survey is not yet available. Please check back on the publish date.'
      });
    }

    if (now > endDate) {
      return res.status(400).json({
        success: false,
        message: 'This survey has expired and is no longer accepting responses.'
      });
    }

    // Get questions for the survey
    const questions = await Question.find({ surveyId: survey._id })
      .sort({ questionOrder: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        survey: {
          _id: survey._id,
          name: survey.name,
          publishDate: survey.publishDate,
          noOfDays: survey.noOfDays,
          department: survey.department
        },
        questions
      }
    });
  } catch (error) {
    console.error('Error fetching survey by token:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching survey'
    });
  }
});

// @desc    Submit anonymous response
// @route   POST /api/responses/anonymous
// @access  Publish
router.post('/responses/anonymous', async (req, res) => {
  try {
    const { surveyId, token, responses } = req.body;

    // Validate input
    if (!surveyId || !token || !responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide surveyId, token, and responses array'
      });
    }

    // Verify survey exists and token is valid
    const survey = await Survey.findOne({ 
      _id: surveyId, 
      anonymousToken: token 
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found or invalid token'
      });
    }

    // Check if survey is still active
    if (!survey.isActive()) {
      return res.status(400).json({
        success: false,
        message: 'Survey is not currently active'
      });
    }

    // Get all questions for the survey to validate responses
    const questions = await Question.find({ surveyId });
    const questionIds = questions.map(q => q._id.toString());

    // Validate all responses
    for (const response of responses) {
      if (!response.questionId || !response.selectedOption) {
        return res.status(400).json({
          success: false,
          message: 'Each response must have questionId and selectedOption'
        });
      }

      // Check if question belongs to this survey
      if (!questionIds.includes(response.questionId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid question ID for this survey'
        });
      }

      // Validate selected option exists for the question
      const question = questions.find(q => q._id.toString() === response.questionId);
      if (!question.options.includes(response.selectedOption)) {
        return res.status(400).json({
          success: false,
          message: `Invalid option "${response.selectedOption}" for question "${question.questionText}"`
        });
      }
    }

    // Generate a unique anonymous ID for this submission
    const anonymousId = require('crypto').randomBytes(16).toString('hex');

    // Save all responses
    const savedResponses = [];
    for (const responseData of responses) {
      const response = new Response({
        surveyId,
        questionId: responseData.questionId,
        selectedOption: responseData.selectedOption,
        anonymousId,
        hasConsent: false, // Anonymous responses don't have consent
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      const savedResponse = await response.save();
      savedResponses.push(savedResponse);
    }

    res.status(201).json({
      success: true,
      message: 'Responses submitted successfully',
      data: {
        submissionId: anonymousId,
        responsesCount: savedResponses.length
      }
    });
  } catch (error) {
    console.error('Error submitting anonymous response:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting responses'
    });
  }
});

// @desc    Get consent form by token
// @route   GET /api/consent/:token/verify
// @access  Publish
router.get('/consent/:token/verify', async (req, res) => {
  try {
    const { token } = req.params;

    // Find consent record by token
    const consent = await Consent.findOne({ consentToken: token })
      .populate('userId', 'name email department')
      .populate('surveyId', 'name publishDate noOfDays');

    if (!consent) {
      return res.status(404).json({
        success: false,
        message: 'Consent token not found or invalid'
      });
    }

    // Check if consent period is still valid
    const isValid = await consent.isConsentPeriodValid();
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Consent period has expired. The survey is now active.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        consent: {
          _id: consent._id,
          consentGiven: consent.consentGiven,
          consentTimestamp: consent.consentTimestamp
        },
        user: consent.userId,
        survey: consent.surveyId
      }
    });
  } catch (error) {
    console.error('Error verifying consent token:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying consent token'
    });
  }
});

// @desc    Record consent
// @route   POST /api/consent/:token
// @access  Publish
router.post('/consent/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { consent } = req.body;

    // Validate consent value
    if (typeof consent !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Consent must be true or false'
      });
    }

    // Find consent record by token
    const consentRecord = await Consent.findOne({ consentToken: token })
      .populate('surveyId', 'name publishDate');

    if (!consentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Consent token not found or invalid'
      });
    }

    // Check if consent period is still valid
    const isValid = await consentRecord.isConsentPeriodValid();
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Consent period has expired. The survey is now active.'
      });
    }

    // Check if consent has already been recorded
    if (consentRecord.consentGiven !== null) {
      return res.status(400).json({
        success: false,
        message: 'Consent has already been recorded for this survey'
      });
    }

    // Update consent record
    consentRecord.consentGiven = consent;
    consentRecord.consentTimestamp = new Date();
    consentRecord.ipAddress = req.ip;
    consentRecord.userAgent = req.get('User-Agent');

    await consentRecord.save();

    res.status(200).json({
      success: true,
      message: `Consent ${consent ? 'given' : 'declined'} successfully`,
      data: {
        consentGiven: consentRecord.consentGiven,
        consentTimestamp: consentRecord.consentTimestamp
      }
    });
  } catch (error) {
    console.error('Error recording consent:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording consent'
    });
  }
});

module.exports = router;

