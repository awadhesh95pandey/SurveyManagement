const Response = require('../models/Response');
const SurveyAttempt = require('../models/SurveyAttempt');
const Survey = require('../models/Survey');
const Question = require('../models/Question');
const Consent = require('../models/Consent');

// @desc    Start a survey attempt
// @route   POST /api/surveys/:surveyId/attempt
// @access  Private
exports.startSurveyAttempt = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.surveyId}`
      });
    }
    
    // Check if survey is active
    if (survey.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Survey is not active'
      });
    }
    
    // Check if user has already completed the survey
    const existingAttempt = await SurveyAttempt.findOne({
      surveyId: req.params.surveyId,
      userId: req.user.id,
      completed: true
    });
    
    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have already completed this survey'
      });
    }
    
    // Check if user has given consent
    let isAnonymous = true;
    const consentRecord = await Consent.findOne({
      surveyId: req.params.surveyId,
      userId: req.user.id
    });
    
    if (consentRecord && consentRecord.consentGiven === true) {
      isAnonymous = false;
    }
    
    // Create survey attempt
    const attempt = await SurveyAttempt.create({
      surveyId: req.params.surveyId,
      userId: isAnonymous ? null : req.user.id,
      startedAt: Date.now(),
      completed: false,
      anonymous: isAnonymous
    });
    
    // Get questions for the survey
    const questions = await Question.find({
      surveyId: req.params.surveyId
    }).sort({ order: 1 });
    
    res.status(201).json({
      success: true,
      data: {
        attempt,
        questions,
        isAnonymous
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit a response to a question
// @route   POST /api/surveys/:surveyId/responses
// @access  Private
exports.submitResponse = async (req, res, next) => {
  try {
    const { questionId, selectedOption, attemptId } = req.body;
    
    if (!questionId || !selectedOption || !attemptId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide questionId, selectedOption, and attemptId'
      });
    }
    
    // Check if survey exists and is active
    const survey = await Survey.findById(req.params.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.surveyId}`
      });
    }
    
    if (survey.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Survey is not active'
      });
    }
    
    // Check if question exists and belongs to the survey
    const question = await Question.findOne({
      _id: questionId,
      surveyId: req.params.surveyId
    });
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found or does not belong to this survey'
      });
    }
    
    // Check if the selected option is valid
    if (!question.options.includes(selectedOption)) {
      return res.status(400).json({
        success: false,
        message: 'Selected option is not valid for this question'
      });
    }
    
    // Check if attempt exists and is not completed
    const attempt = await SurveyAttempt.findOne({
      _id: attemptId,
      surveyId: req.params.surveyId,
      completed: false
    });
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Survey attempt not found or already completed'
      });
    }
    
    // Check if a response already exists for this question in this attempt
    const existingResponse = await Response.findOne({
      surveyId: req.params.surveyId,
      questionId,
      userId: attempt.userId
    });
    
    if (existingResponse) {
      // Update existing response
      const updatedResponse = await Response.findByIdAndUpdate(
        existingResponse._id,
        {
          selectedOption,
          submittedAt: Date.now()
        },
        {
          new: true,
          runValidators: true
        }
      );
      
      return res.status(200).json({
        success: true,
        data: updatedResponse
      });
    }
    
    // Create new response
    const response = await Response.create({
      surveyId: req.params.surveyId,
      questionId,
      userId: attempt.userId,
      selectedOption,
      anonymous: attempt.anonymous
    });
    
    res.status(201).json({
      success: true,
      data: response
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Complete a survey attempt
// @route   PUT /api/surveys/:surveyId/attempt/:attemptId/complete
// @access  Private
exports.completeSurveyAttempt = async (req, res, next) => {
  try {
    // Check if survey exists
    const survey = await Survey.findById(req.params.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.surveyId}`
      });
    }
    
    // Check if attempt exists and belongs to the user
    const attempt = await SurveyAttempt.findOne({
      _id: req.params.attemptId,
      surveyId: req.params.surveyId
    });
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Survey attempt not found'
      });
    }
    
    // If the attempt is not anonymous, verify it belongs to the current user
    if (!attempt.anonymous && attempt.userId && attempt.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to complete this survey attempt'
      });
    }
    
    // Check if all questions have been answered
    const questions = await Question.find({
      surveyId: req.params.surveyId
    });
    
    const responses = await Response.find({
      surveyId: req.params.surveyId,
      userId: attempt.userId
    });
    
    if (responses.length < questions.length) {
      return res.status(400).json({
        success: false,
        message: `Please answer all questions. ${responses.length} of ${questions.length} questions answered.`
      });
    }
    
    // Update attempt to completed
    const updatedAttempt = await SurveyAttempt.findByIdAndUpdate(
      req.params.attemptId,
      {
        completedAt: Date.now(),
        completed: true
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: updatedAttempt
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all responses for a survey
// @route   GET /api/surveys/:surveyId/responses
// @access  Private (Admin only)
exports.getSurveyResponses = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.surveyId}`
      });
    }
    
    // Make sure user is survey creator or admin
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view responses for this survey`
      });
    }
    
    // Get all responses with question data
    const responses = await Response.find({
      surveyId: req.params.surveyId
    }).populate('questionId', 'questionText options parameter');
    
    res.status(200).json({
      success: true,
      count: responses.length,
      data: responses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get responses for a specific user
// @route   GET /api/surveys/:surveyId/responses/user/:userId
// @access  Private (Admin only or self)
exports.getUserResponses = async (req, res, next) => {
  try {
    // Check if user has given consent
    const consentRecord = await Consent.findOne({
      surveyId: req.params.surveyId,
      userId: req.params.userId,
      consentGiven: true
    });
    
    if (!consentRecord) {
      return res.status(403).json({
        success: false,
        message: 'User has not given consent to view their responses'
      });
    }
    
    // Check if user is requesting their own responses or is an admin
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view these responses'
      });
    }
    
    // Get responses with question data
    const responses = await Response.find({
      surveyId: req.params.surveyId,
      userId: req.params.userId
    }).populate('questionId', 'questionText options parameter');
    
    res.status(200).json({
      success: true,
      count: responses.length,
      data: responses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get survey participation statistics
// @route   GET /api/surveys/:surveyId/participation
// @access  Private (Admin only)
exports.getSurveyParticipation = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.surveyId}`
      });
    }
    
    // Make sure user is survey creator or admin
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view participation for this survey`
      });
    }
    
    // Get participation statistics
    const attempts = await SurveyAttempt.find({
      surveyId: req.params.surveyId
    });
    
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completed).length;
    const identifiedUsers = attempts.filter(a => a.userId !== null).length;
    const anonymousUsers = attempts.filter(a => a.anonymous).length;
    
    res.status(200).json({
      success: true,
      data: {
        totalAttempts,
        completedAttempts,
        identifiedUsers,
        anonymousUsers,
        completionRate: totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0
      }
    });
  } catch (err) {
    next(err);
  }
};

