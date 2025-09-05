const SurveyToken = require('../models/SurveyToken');
const Survey = require('../models/Survey');
const crypto = require('crypto');

// @desc    Generate tokens for survey participants
// @route   POST /api/surveys/:surveyId/tokens/generate
// @access  Private
exports.generateSurveyTokens = async (req, res, next) => {
  try {
    const { employees } = req.body; // Array of { email, name }
    const surveyId = req.params.surveyId;
    
    // Verify survey exists and user has permission
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    if (survey.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate tokens for this survey'
      });
    }
    
    const tokens = [];
    const errors = [];
    
    for (const employee of employees) {
      try {
        // Check if token already exists for this employee
        const existingToken = await SurveyToken.findOne({
          surveyId: surveyId,
          employeeEmail: employee.email.toLowerCase().trim()
        });
        
        if (existingToken) {
          errors.push({
            email: employee.email,
            message: 'Token already exists for this employee'
          });
          continue;
        }
        
        // Generate unique token ID
        const tokenId = crypto.randomBytes(16).toString('hex');
        
        // Create survey token
        const surveyToken = await SurveyToken.create({
          surveyId: surveyId,
          tokenId: tokenId,
          employeeEmail: employee.email.toLowerCase().trim(),
          employeeName: employee.name || '',
          expiresAt: survey.endDate || null
        });
        
        tokens.push({
          tokenId: surveyToken.tokenId,
          employeeEmail: surveyToken.employeeEmail,
          employeeName: surveyToken.employeeName,
          surveyUrl: `${req.protocol}://${req.get('host')}/surveys/${surveyId}/${tokenId}/take`
        });
        
      } catch (error) {
        errors.push({
          email: employee.email,
          message: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Generated ${tokens.length} tokens successfully`,
      data: {
        tokens: tokens,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error('Error generating survey tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating tokens'
    });
  }
};

// @desc    Get all tokens for a survey
// @route   GET /api/surveys/:surveyId/tokens
// @access  Private
exports.getSurveyTokens = async (req, res, next) => {
  try {
    const surveyId = req.params.surveyId;
    
    // Verify survey exists and user has permission
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    if (survey.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view tokens for this survey'
      });
    }
    
    const tokens = await SurveyToken.find({ surveyId: surveyId })
      .select('-__v')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens
    });
    
  } catch (error) {
    console.error('Error fetching survey tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tokens'
    });
  }
};

// @desc    Validate a survey token (public route)
// @route   GET /api/surveys/:surveyId/tokens/:tokenId/validate
// @access  Public
exports.validateSurveyToken = async (req, res, next) => {
  try {
    const { surveyId, tokenId } = req.params;
    
    // Validate the token
    const validation = await SurveyToken.validateToken(surveyId, tokenId);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    // Get survey details
    const survey = await Survey.findById(surveyId)
      .select('title description status startDate endDate');
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    if (survey.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Survey is not active'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        survey: survey,
        token: {
          tokenId: validation.token.tokenId,
          employeeEmail: validation.token.employeeEmail,
          employeeName: validation.token.employeeName
        }
      }
    });
    
  } catch (error) {
    console.error('Error validating survey token:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating token'
    });
  }
};

// @desc    Delete/Revoke a survey token
// @route   DELETE /api/surveys/:surveyId/tokens/:tokenId
// @access  Private
exports.revokeSurveyToken = async (req, res, next) => {
  try {
    const { surveyId, tokenId } = req.params;
    
    // Verify survey exists and user has permission
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    if (survey.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to revoke tokens for this survey'
      });
    }
    
    const token = await SurveyToken.findOneAndDelete({
      surveyId: surveyId,
      tokenId: tokenId
    });
    
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Token revoked successfully'
    });
    
  } catch (error) {
    console.error('Error revoking survey token:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while revoking token'
    });
  }
};

