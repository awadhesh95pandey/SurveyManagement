const Survey = require('../models/Survey');
const Question = require('../models/Question');
const Response = require('../models/Response');
const SurveyAttempt = require('../models/SurveyAttempt');
const Consent = require('../models/Consent');
const User = require('../models/User');

// @desc    Generate survey report
// @route   GET /api/reports/surveys/:surveyId
// @access  Private (Admin only)
exports.generateSurveyReport = async (req, res, next) => {
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
        message: `User ${req.user.id} is not authorized to generate reports for this survey`
      });
    }
    
    // Get questions
    const questions = await Question.find({
      surveyId: req.params.surveyId
    }).sort({ order: 1 });
    
    // Get participation statistics
    const attempts = await SurveyAttempt.find({
      surveyId: req.params.surveyId
    });
    
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completed).length;
    const identifiedUsers = attempts.filter(a => a.userId !== null).length;
    const anonymousUsers = attempts.filter(a => a.anonymous).length;
    
    // Get question results
    const questionResults = await Promise.all(
      questions.map(async question => {
        // Get response distribution
        const responses = await Response.find({
          surveyId: req.params.surveyId,
          questionId: question._id
        });
        
        // Count responses by option
        const distribution = {};
        question.options.forEach(option => {
          distribution[option] = 0;
        });
        
        responses.forEach(response => {
          if (distribution[response.selectedOption] !== undefined) {
            distribution[response.selectedOption]++;
          }
        });
        
        // Calculate percentages
        const percentages = {};
        const totalResponses = responses.length;
        
        Object.keys(distribution).forEach(option => {
          percentages[option] = totalResponses > 0 
            ? (distribution[option] / totalResponses) * 100 
            : 0;
        });
        
        return {
          questionId: question._id,
          questionText: question.questionText,
          parameter: question.parameter,
          options: question.options,
          totalResponses,
          distribution,
          percentages
        };
      })
    );
    
    // Get parameter-based results
    const parameters = [...new Set(questions.map(q => q.parameter).filter(p => p))];
    
    const parameterResults = await Promise.all(
      parameters.map(async parameter => {
        // Get questions for this parameter
        const paramQuestions = questions.filter(q => q.parameter === parameter);
        
        // Get results for each question
        const results = await Promise.all(
          paramQuestions.map(async question => {
            const responses = await Response.find({
              surveyId: req.params.surveyId,
              questionId: question._id
            });
            
            // Count responses by option
            const distribution = {};
            question.options.forEach(option => {
              distribution[option] = 0;
            });
            
            responses.forEach(response => {
              if (distribution[response.selectedOption] !== undefined) {
                distribution[response.selectedOption]++;
              }
            });
            
            return {
              questionId: question._id,
              questionText: question.questionText,
              totalResponses: responses.length,
              distribution
            };
          })
        );
        
        return {
          parameter,
          questions: results
        };
      })
    );
    
    // Get consent statistics
    const consentRecords = await Consent.find({
      surveyId: req.params.surveyId
    });
    
    const totalConsents = consentRecords.length;
    const consentGiven = consentRecords.filter(c => c.consentGiven === true).length;
    const consentDenied = consentRecords.filter(c => c.consentGiven === false).length;
    const noResponse = consentRecords.filter(c => c.consentGiven === null).length;
    
    // Compile report
    const report = {
      survey: {
        id: survey._id,
        name: survey.name,
        publishDate: survey.publishDate,
        endDate: survey.endDate,
        department: survey.department,
        status: survey.status,
        createdAt: survey.createdAt
      },
      participation: {
        totalAttempts,
        completedAttempts,
        identifiedUsers,
        anonymousUsers,
        completionRate: totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0
      },
      consent: {
        totalConsents,
        consentGiven,
        consentDenied,
        noResponse,
        consentRate: totalConsents > 0 ? (consentGiven / totalConsents) * 100 : 0
      },
      questionResults,
      parameterResults
    };
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate user report
// @route   GET /api/reports/users/:userId/surveys/:surveyId
// @access  Private (Admin or self)
exports.generateUserReport = async (req, res, next) => {
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
    
    // Check if user is requesting their own report or is an admin
    if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this report'
      });
    }
    
    // Get survey
    const survey = await Survey.findById(req.params.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.surveyId}`
      });
    }
    
    // Get user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with id of ${req.params.userId}`
      });
    }
    
    // Get questions
    const questions = await Question.find({
      surveyId: req.params.surveyId
    }).sort({ order: 1 });
    
    // Get user's responses
    const responses = await Response.find({
      surveyId: req.params.surveyId,
      userId: req.params.userId
    });
    
    // Map responses to questions
    const userResponses = questions.map(question => {
      const response = responses.find(r => r.questionId.toString() === question._id.toString());
      
      return {
        questionId: question._id,
        questionText: question.questionText,
        parameter: question.parameter,
        options: question.options,
        selectedOption: response ? response.selectedOption : null,
        submittedAt: response ? response.submittedAt : null
      };
    });
    
    // Group responses by parameter
    const parameterResponses = {};
    
    userResponses.forEach(response => {
      if (response.parameter) {
        if (!parameterResponses[response.parameter]) {
          parameterResponses[response.parameter] = [];
        }
        
        parameterResponses[response.parameter].push(response);
      }
    });
    
    // Get survey attempt
    const attempt = await SurveyAttempt.findOne({
      surveyId: req.params.surveyId,
      userId: req.params.userId
    });
    
    // Compile report
    const report = {
      survey: {
        id: survey._id,
        name: survey.name,
        publishDate: survey.publishDate,
        endDate: survey.endDate
      },
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department
      },
      attempt: attempt ? {
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        completed: attempt.completed
      } : null,
      responses: userResponses,
      parameterResponses
    };
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export survey results to PDF/Excel
// @route   GET /api/reports/surveys/:surveyId/export
// @access  Private (Admin only)
exports.exportSurveyResults = async (req, res, next) => {
  try {
    const format = req.query.format || 'json';
    
    // Get survey report data
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
        message: `User ${req.user.id} is not authorized to export results for this survey`
      });
    }
    
    // Get questions
    const questions = await Question.find({
      surveyId: req.params.surveyId
    }).sort({ order: 1 });
    
    // Get all responses
    const responses = await Response.find({
      surveyId: req.params.surveyId
    });
    
    // Get participation statistics
    const attempts = await SurveyAttempt.find({
      surveyId: req.params.surveyId
    });
    
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completed).length;
    
    // Format data based on requested format
    if (format === 'json') {
      // Return JSON data
      const reportData = {
        survey: {
          id: survey._id,
          name: survey.name,
          publishDate: survey.publishDate,
          endDate: survey.endDate,
          department: survey.department,
          status: survey.status
        },
        participation: {
          totalAttempts,
          completedAttempts,
          completionRate: totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0
        },
        questions: questions.map(question => {
          const questionResponses = responses.filter(
            r => r.questionId.toString() === question._id.toString()
          );
          
          // Count responses by option
          const distribution = {};
          question.options.forEach(option => {
            distribution[option] = 0;
          });
          
          questionResponses.forEach(response => {
            if (distribution[response.selectedOption] !== undefined) {
              distribution[response.selectedOption]++;
            }
          });
          
          return {
            questionId: question._id,
            questionText: question.questionText,
            parameter: question.parameter,
            options: question.options,
            totalResponses: questionResponses.length,
            distribution
          };
        })
      };
      
      return res.status(200).json({
        success: true,
        data: reportData
      });
    } else {
      // For now, just return JSON with a message that other formats are not implemented
      // In a real implementation, you would generate PDF or Excel here
      return res.status(200).json({
        success: true,
        message: `Export to ${format} format is not implemented yet. Please use 'json' format.`,
        data: {
          survey: {
            id: survey._id,
            name: survey.name
          }
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

