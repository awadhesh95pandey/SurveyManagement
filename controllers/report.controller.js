const Survey = require('../models/Survey');
const Question = require('../models/Question');
const Response = require('../models/Response');
const SurveyAttempt = require('../models/SurveyAttempt');
const Consent = require('../models/Consent');
const User = require('../models/User');
const SurveyToken = require('../models/SurveyToken');
const ExcelJS = require('exceljs');
const { Parser } = require('@json2csv/plainjs');

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

// @desc    Get detailed survey responses
// @route   GET /api/reports/surveys/:surveyId/responses
// @access  Private (Admin only)
exports.getDetailedSurveyResponses = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
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
    
    // Get questions for the survey
    const questions = await Question.find({
      surveyId: req.params.surveyId
    }).sort({ order: 1 });
    
    // Get all responses with populated data
    const responses = await Response.find({
      surveyId: req.params.surveyId
    })
    .populate('questionId', 'questionText options parameter order')
    .populate('userId', 'name email department')
    .sort({ submittedAt: -1 });
    
    // Get survey attempts to get completion info
    const attempts = await SurveyAttempt.find({
      surveyId: req.params.surveyId
    }).populate('userId', 'name email department');
    
    // Get survey tokens for anonymous responses
    const tokens = await SurveyToken.find({
      surveyId: req.params.surveyId
    });
    
    // Group responses by participant (userId, anonymousId, or surveyTokenId)
    const participantResponses = {};
    
    responses.forEach(response => {
      let participantKey;
      let participantInfo = {};
      
      if (response.userId) {
        // Authenticated user response
        participantKey = response.userId._id.toString();
        participantInfo = {
          type: 'authenticated',
          id: response.userId._id,
          name: response.userId.name,
          email: response.userId.email,
          department: response.userId.department
        };
      } else if (response.surveyTokenId) {
        // Token-based response
        participantKey = response.surveyTokenId.toString();
        const token = tokens.find(t => t._id.toString() === response.surveyTokenId.toString());
        participantInfo = {
          type: 'token',
          id: response.surveyTokenId,
          name: token ? token.employeeName : 'Anonymous',
          email: token ? token.employeeEmail : 'N/A',
          department: token ? token.department : 'N/A'
        };
      } else {
        // Anonymous response
        participantKey = response.anonymousId || response._id.toString();
        participantInfo = {
          type: 'anonymous',
          id: participantKey,
          name: 'Anonymous',
          email: 'N/A',
          department: 'N/A'
        };
      }
      
      if (!participantResponses[participantKey]) {
        participantResponses[participantKey] = {
          participant: participantInfo,
          responses: [],
          submittedAt: response.submittedAt,
          completed: false
        };
      }
      
      participantResponses[participantKey].responses.push({
        questionId: response.questionId._id,
        questionText: response.questionId.questionText,
        parameter: response.questionId.parameter,
        order: response.questionId.order,
        selectedOption: response.selectedOption,
        submittedAt: response.submittedAt
      });
    });
    
    // Check completion status for each participant
    Object.keys(participantResponses).forEach(participantKey => {
      const participant = participantResponses[participantKey];
      const attempt = attempts.find(a => {
        if (participant.participant.type === 'authenticated') {
          return a.userId && a.userId._id.toString() === participantKey;
        } else if (participant.participant.type === 'token') {
          return a.surveyTokenId === participantKey;
        }
        return false;
      });
      
      participant.completed = attempt ? attempt.completed : participant.responses.length === questions.length;
      participant.startedAt = attempt ? attempt.startedAt : null;
      participant.completedAt = attempt ? attempt.completedAt : null;
    });
    
    // Convert to array and sort by submission time
    const detailedResponses = Object.values(participantResponses)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResponses = detailedResponses.slice(startIndex, endIndex);
    
    // Calculate statistics
    const totalParticipants = detailedResponses.length;
    const completedParticipants = detailedResponses.filter(p => p.completed).length;
    const authenticatedParticipants = detailedResponses.filter(p => p.participant.type === 'authenticated').length;
    const tokenParticipants = detailedResponses.filter(p => p.participant.type === 'token').length;
    const anonymousParticipants = detailedResponses.filter(p => p.participant.type === 'anonymous').length;
    
    res.status(200).json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          name: survey.name,
          publishDate: survey.publishDate,
          durationDays: survey.durationDays,
          department: survey.department
        },
        questions: questions.map(q => ({
          id: q._id,
          questionText: q.questionText,
          parameter: q.parameter,
          options: q.options,
          order: q.order
        })),
        statistics: {
          totalParticipants,
          completedParticipants,
          authenticatedParticipants,
          tokenParticipants,
          anonymousParticipants,
          completionRate: totalParticipants > 0 ? (completedParticipants / totalParticipants) * 100 : 0
        },
        responses: paginatedResponses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalParticipants / limit),
          totalItems: totalParticipants,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export detailed survey responses to CSV/Excel
// @route   GET /api/reports/surveys/:surveyId/export/detailed
// @access  Private (Admin only)
exports.exportDetailedSurveyResponses = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
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
        message: `User ${req.user.id} is not authorized to export responses for this survey`
      });
    }
    
    // Get questions for the survey
    const questions = await Question.find({
      surveyId: req.params.surveyId
    }).sort({ order: 1 });
    
    // Get all responses with populated data
    const responses = await Response.find({
      surveyId: req.params.surveyId
    })
    .populate('questionId', 'questionText options parameter order')
    .populate('userId', 'name email department')
    .sort({ submittedAt: -1 });
    
    // Get survey tokens for anonymous responses
    const tokens = await SurveyToken.find({
      surveyId: req.params.surveyId
    });
    
    // Prepare data for export
    const exportData = [];
    
    // Group responses by participant
    const participantResponses = {};
    
    responses.forEach(response => {
      let participantKey;
      let participantInfo = {};
      
      if (response.userId) {
        participantKey = response.userId._id.toString();
        participantInfo = {
          name: response.userId.name,
          email: response.userId.email,
          department: response.userId.department,
          type: 'Authenticated'
        };
      } else if (response.surveyTokenId) {
        participantKey = response.surveyTokenId.toString();
        const token = tokens.find(t => t._id.toString() === response.surveyTokenId.toString());
        participantInfo = {
          name: token ? token.employeeName : 'Anonymous',
          email: token ? token.employeeEmail : 'N/A',
          department: token ? token.department : 'N/A',
          type: 'Token-based'
        };
      } else {
        participantKey = response.anonymousId || response._id.toString();
        participantInfo = {
          name: 'Anonymous',
          email: 'N/A',
          department: 'N/A',
          type: 'Anonymous'
        };
      }
      
      if (!participantResponses[participantKey]) {
        participantResponses[participantKey] = {
          participant: participantInfo,
          responses: {},
          submittedAt: response.submittedAt
        };
      }
      
      participantResponses[participantKey].responses[response.questionId._id.toString()] = {
        questionText: response.questionId.questionText,
        parameter: response.questionId.parameter,
        selectedOption: response.selectedOption,
        submittedAt: response.submittedAt
      };
    });
    
    // Convert to flat structure for export
    Object.values(participantResponses).forEach(participant => {
      const row = {
        'Participant Name': participant.participant.name,
        'Email': participant.participant.email,
        'Department': participant.participant.department,
        'Response Type': participant.participant.type,
        'Submitted At': participant.submittedAt.toISOString()
      };
      
      // Add each question as a column
      questions.forEach(question => {
        const response = participant.responses[question._id.toString()];
        row[`Q${question.order}: ${question.questionText}`] = response ? response.selectedOption : 'No Response';
      });
      
      exportData.push(row);
    });
    
    if (format === 'csv') {
      // Generate CSV
      const parser = new Parser();
      const csv = parser.parse(exportData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey_responses_${survey.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`);
      res.send(csv);
    } else if (format === 'xlsx') {
      // Generate Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Survey Responses');
      
      // Add headers
      const headers = Object.keys(exportData[0] || {});
      worksheet.addRow(headers);
      
      // Style headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add data rows
      exportData.forEach(row => {
        worksheet.addRow(Object.values(row));
      });
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="survey_responses_${survey.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx"`);
      
      await workbook.xlsx.write(res);
      res.end();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, xlsx'
      });
    }
  } catch (err) {
    next(err);
  }
};
