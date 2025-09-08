const Response = require('../models/Response');
const SurveyAttempt = require('../models/SurveyAttempt');
const Survey = require('../models/Survey');
const Question = require('../models/Question');
const Consent = require('../models/Consent');
const SurveyToken = require('../models/SurveyToken');

// @desc    Start a survey attempt with token
// @route   POST /api/surveys/:surveyId/:tokenId/attempt
// @access  Public
exports.startSurveyAttemptWithToken = async (req, res, next) => {
  try {
    const { surveyId, tokenId } = req.params;
    
    // Validate the survey token
    const tokenValidation = await SurveyToken.validateToken(surveyId, tokenId);
    
    if (!tokenValidation.valid) {
      return res.status(400).json({
        success: false,
        message: tokenValidation.message,
        status: 'invalid_token'
      });
    }
    
    const token = tokenValidation.token;
    
    // Check if this token has already been used to submit responses
    const existingResponse = await Response.findOne({
      surveyId: surveyId,
      surveyTokenId: tokenId
    });
    
    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'This survey link has already been used to submit a response.',
        status: 'already_completed'
      });
    }
    
    // Get survey details
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    // if (survey.status !== 'active') {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Survey is not active'
    //   });
    // }

    const now = new Date();
    const publishDate = new Date(survey.publishDate);
    const endDate = new Date(publishDate);
    endDate.setDate(endDate.getDate() + survey.durationDays);

    if (now < publishDate || now > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Survey is not currently active'
      });
    }
 
    // Create survey attempt
    const attempt = await SurveyAttempt.create({
      surveyId: surveyId,
      userId: null, // Public access
      startedAt: Date.now(),
      completed: false,
      anonymous: true,
      surveyTokenId: tokenId
    });
    
    // Get questions for the survey
    const questions = await Question.find({ surveyId: surveyId })
      .select('questionText questionType options required')
      .sort({ order: 1 });
    
    res.status(201).json({
      success: true,
      message: 'Survey attempt started successfully',
      data: {
        attemptId: attempt._id,
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description
        },
        questions: questions,
        employee: {
          email: token.employeeEmail,
          name: token.employeeName
        }
      }
    });
    
  } catch (error) {
    console.error('Error starting survey attempt with token:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting survey attempt'
    });
  }
};

// @desc    Start a survey attempt (legacy)
// @route   POST /api/surveys/:surveyId/attempt
// @access  Private/Public
exports.startSurveyAttempt = async (req, res, next) => {
  try {
    const { token } = req.body; // For public access, require employee token
    
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
    
    // Handle both authenticated and public access
    const userId = req.user ? req.user.id : null;
    let isAnonymous = true;
    
    // For public access, require employee token to enforce single response per employee
    if (!userId && !token) {
      return res.status(400).json({
        success: false,
        message: 'Employee token is required for survey participation'
      });
    }
    
    // Check for existing responses from this employee token (for public access)
    if (!userId && token) {
      const existingResponse = await Response.findOne({
        surveyId: req.params.surveyId,
        employeeToken: token.trim()
      });
      
      if (existingResponse) {
        return res.status(400).json({
          success: false,
          message: 'This employee token has already been used to complete this survey.',
          status: 'already_completed'
        });
      }
    }
    
    if (userId) {
      // Check if user has already completed the survey (only for authenticated users)
      const existingAttempt = await SurveyAttempt.findOne({
        surveyId: req.params.surveyId,
        userId: userId,
        completed: true
      });
      
      if (existingAttempt) {
        return res.status(400).json({
          success: false,
          message: 'You have already completed this survey'
        });
      }
      
      // Check if user has given consent
      const consentRecord = await Consent.findOne({
        surveyId: req.params.surveyId,
        userId: userId
      });
      
      if (consentRecord && consentRecord.consentGiven === true) {
        isAnonymous = false;
      }
    }
    
    // Create survey attempt
    const attempt = await SurveyAttempt.create({
      surveyId: req.params.surveyId,
      userId: isAnonymous ? null : userId,
      startedAt: Date.now(),
      completed: false,
      anonymous: isAnonymous,
      employeeToken: token ? token.trim() : null
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

// @desc    Submit a response to a question (single or bulk)
// @route   POST /api/surveys/:surveyId/responses
// @access  Private/Public
exports.submitResponse = async (req, res, next) => {
  try {
    // Handle both single response and bulk responses
    const { questionId, selectedOption, attemptId, responses } = req.body;
    
    // Check if this is a bulk response submission
    if (responses && Array.isArray(responses)) {
      return await handleBulkResponseSubmission(req, res, next);
    }
    
    // Handle single response submission
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
    
    // If the attempt is not anonymous and user is authenticated, verify it belongs to the current user
    if (!attempt.anonymous && attempt.userId && req.user && attempt.userId.toString() !== req.user.id) {
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

// Helper function to handle bulk response submission
const handleBulkResponseSubmission = async (req, res, next) => {
  try {
    const { attemptId, responses } = req.body;
    
    if (!attemptId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attemptId and responses array'
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
    
    // Get all questions for the survey to validate responses
    const questions = await Question.find({ surveyId: req.params.surveyId });
    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });
    
    // Validate all responses
    for (const responseData of responses) {
      if (!responseData.questionId || !responseData.answer) {
        return res.status(400).json({
          success: false,
          message: 'Each response must have questionId and answer'
        });
      }
      
      const question = questionMap[responseData.questionId];
      if (!question) {
        return res.status(400).json({
          success: false,
          message: `Question with ID ${responseData.questionId} not found in this survey`
        });
      }
      
      // Validate answer based on question type
      if (question.type === 'multiple-choice' && !question.options.includes(responseData.answer)) {
        return res.status(400).json({
          success: false,
          message: `Invalid option "${responseData.answer}" for question "${question.text}"`
        });
      }
    }
    
    // Save all responses
    const savedResponses = [];
    for (const responseData of responses) {
      const question = questionMap[responseData.questionId];
      
      // Check if a response already exists for this question in this attempt
      let existingResponse = await Response.findOne({
        surveyId: req.params.surveyId,
        questionId: responseData.questionId,
        userId: attempt.userId,
        attemptId: attemptId
      });
      
      if (existingResponse) {
        // Update existing response
        existingResponse.selectedOption = responseData.answer;
        existingResponse.updatedAt = Date.now();
        await existingResponse.save();
        savedResponses.push(existingResponse);
      } else {
        // Create new response
        const response = await Response.create({
          surveyId: req.params.surveyId,
          questionId: responseData.questionId,
          selectedOption: responseData.answer,
          userId: attempt.userId,
          attemptId: attemptId,
          anonymous: attempt.anonymous,
          employeeToken: attempt.employeeToken
        });
        savedResponses.push(response);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Responses submitted successfully',
      data: {
        responsesCount: savedResponses.length,
        attemptId: attemptId
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit survey responses using token
// @route   POST /api/surveys/token/:token/responses
// @access  Public
exports.submitTokenBasedResponse = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { responses } = req.body;
    
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide responses array'
      });
    }
    
    // Find and validate the token
    const surveyToken = await SurveyToken.findOne({ token })
      .populate('surveyId')
      .populate('employeeId', 'name email department');
    
    if (!surveyToken) {
      return res.status(404).json({
        success: false,
        message: 'Invalid survey token'
      });
    }
    
    // Check if token is expired
    if (surveyToken.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Survey token has expired',
        status: 'expired',
        expiredAt: surveyToken.expiresAt
      });
    }
    
    // Check if token is already used
    if (surveyToken.status === 'used') {
      // Log attempt to use already used token
      console.warn(`Attempt to reuse survey token:`, {
        tokenId: surveyToken._id,
        employeeId: surveyToken.employeeId._id,
        employeeEmail: surveyToken.employeeId.email,
        surveyId: surveyToken.surveyId,
        originalUsedAt: surveyToken.usedAt,
        attemptedAt: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({
        success: false,
        message: 'Survey has already been completed using this token',
        status: 'used',
        usedAt: surveyToken.usedAt
      });
    }
    
    const survey = surveyToken.surveyId;
    
    // Check survey timing
    const now = new Date();
    const publishDate = new Date(survey.publishDate);
    const endDate = survey.endDate;
    
    if (now < publishDate) {
      return res.status(400).json({
        success: false,
        message: 'Survey has not started yet',
        status: 'upcoming',
        publishDate: publishDate
      });
    } else if (now > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Survey has ended',
        status: 'closed',
        endDate: endDate
      });
    }
    
    // Get all questions for the survey to validate responses
    const questions = await Question.find({ surveyId: survey._id });
    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });
    
    // Validate all responses
    for (const responseData of responses) {
      if (!responseData.questionId || responseData.answer === undefined || responseData.answer === null) {
        return res.status(400).json({
          success: false,
          message: 'Each response must have questionId and answer'
        });
      }
      
      const question = questionMap[responseData.questionId];
      if (!question) {
        return res.status(400).json({
          success: false,
          message: `Question with ID ${responseData.questionId} not found in this survey`
        });
      }
      
      // Validate answer based on question type
      if (question.type === 'multiple_choice' && question.options && !question.options.includes(responseData.answer)) {
        return res.status(400).json({
          success: false,
          message: `Invalid option "${responseData.answer}" for question "${question.text || question.question}"`
        });
      }
    }
    
    // Save all responses
    const savedResponses = [];
    for (const responseData of responses) {
      const question = questionMap[responseData.questionId];
      
      // Create response linked to the survey token
      const response = await Response.create({
        surveyId: survey._id,
        questionId: responseData.questionId,
        selectedOption: responseData.answer,
        userId: surveyToken.employeeId._id, // Link to employee
        surveyTokenId: surveyToken._id, // Link to token
        hasConsent: true, // Token-based responses have implicit consent
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      
      savedResponses.push(response);
    }
    
    // Mark token as used
    await surveyToken.markAsUsed(savedResponses[0]._id);
    
    // Log successful submission for audit purposes
    console.log(`Survey submission completed:`, {
      surveyId: survey._id,
      surveyName: survey.name,
      employeeId: surveyToken.employeeId._id,
      employeeName: surveyToken.employeeId.name,
      employeeEmail: surveyToken.employeeId.email,
      tokenId: surveyToken._id,
      responsesCount: savedResponses.length,
      submittedAt: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    res.status(201).json({
      success: true,
      message: 'Survey submitted successfully! Thank you for your participation.',
      data: {
        surveyId: survey._id,
        surveyName: survey.name,
        responsesCount: savedResponses.length,
        submittedAt: new Date(),
        employee: {
          name: surveyToken.employeeId.name,
          department: surveyToken.employeeId.department
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get questions for token-based survey
// @route   GET /api/surveys/token/:token/questions
// @access  Public
exports.getTokenBasedQuestions = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // Find and validate the token
    const surveyToken = await SurveyToken.findOne({ token })
      .populate('surveyId');
    
    if (!surveyToken) {
      return res.status(404).json({
        success: false,
        message: 'Invalid survey token'
      });
    }
    
    // Check if token is expired
    if (surveyToken.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Survey token has expired',
        status: 'expired',
        expiredAt: surveyToken.expiresAt
      });
    }
    
    // Check if token is already used
    if (surveyToken.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'Survey has already been completed',
        status: 'used',
        usedAt: surveyToken.usedAt
      });
    }
    
    const survey = surveyToken.surveyId;
    
    // Get questions for the survey
    const questions = await Question.find({ surveyId: survey._id })
      .sort({ order: 1, createdAt: 1 });
    
    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit survey responses with token (new URL format)
// @route   POST /api/surveys/:surveyId/:tokenId/responses/submit
// @access  Public
exports.submitSurveyResponsesWithToken = async (req, res, next) => {
  try {
    const { surveyId, tokenId } = req.params;
    const { attemptId, responses } = req.body;
    
    // Validate the survey token
    const tokenValidation = await SurveyToken.validateToken(surveyId, tokenId);
    
    if (!tokenValidation.valid) {
      return res.status(400).json({
        success: false,
        message: tokenValidation.message,
        status: 'invalid_token'
      });
    }
    
    const token = tokenValidation.token;
    
    // Check if this token has already been used to submit responses
    const existingResponse = await Response.findOne({
      surveyId: surveyId,
      surveyTokenId: tokenId
    });
    
    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'This survey link has already been used to submit a response.',
        status: 'already_completed'
      });
    }
    
    // Get the survey attempt
    const attempt = await SurveyAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Survey attempt not found'
      });
    }
    
    if (attempt.surveyTokenId !== tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Token mismatch with survey attempt'
      });
    }
    
    if (attempt.completed) {
      return res.status(400).json({
        success: false,
        message: 'Survey attempt already completed'
      });
    }
    
    // Validate responses
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No responses provided'
      });
    }
    
    // Get survey questions to validate responses
    const questions = await Question.find({ surveyId: surveyId });
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));
    
    // Validate each response
    for (const responseData of responses) {
      const question = questionMap.get(responseData.questionId);
      if (!question) {
        return res.status(400).json({
          success: false,
          message: `Invalid question ID: ${responseData.questionId}`
        });
      }
      
      if (question.required && (!responseData.answer || responseData.answer.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: `Response required for question: ${question.questionText}`
        });
      }
    }
    
    // Save responses
    const savedResponses = [];
    for (const responseData of responses) {
      if (responseData.answer && responseData.answer.trim() !== '') {
        const response = await Response.create({
          surveyId: surveyId,
          questionId: responseData.questionId,
          selectedOption: responseData.answer,
          userId: null, // Public access
          attemptId: attemptId,
          anonymous: true,
          surveyTokenId: tokenId
        });
        savedResponses.push(response);
      }
    }
    
    // Mark attempt as completed
    attempt.completed = true;
    attempt.completedAt = Date.now();
    await attempt.save();
    
    // Mark token as used
    await token.markAsUsed();
    
    res.status(201).json({
      success: true,
      message: 'Survey responses submitted successfully',
      data: {
        attemptId: attempt._id,
        responsesCount: savedResponses.length,
        completedAt: attempt.completedAt
      }
    });
    
  } catch (error) {
    console.error('Error submitting survey responses with token:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting responses'
    });
  }
};
