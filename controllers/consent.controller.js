const Consent = require('../models/Consent');
const Survey = require('../models/Survey');
const User = require('../models/User');

// @desc    Record user consent
// @route   POST /api/consent/:token
// @access  Publish
exports.recordConsent = async (req, res, next) => {
  try {
    const { consent } = req.body;
    
    if (consent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide consent value'
      });
    }
    
    // Find consent record by token
    const consentRecord = await Consent.findOne({
      consentToken: req.params.token
    });
    
    if (!consentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Invalid consent token'
      });
    }
    
    // Check if consent has already been given
    if (consentRecord.consentGiven !== null) {
      return res.status(400).json({
        success: false,
        message: 'Consent has already been recorded'
      });
    }
    
    // Check if consent deadline has passed
    const survey = await Survey.findById(consentRecord.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    if (new Date() > new Date(survey.consentDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Consent deadline has passed'
      });
    }
    
    // Update consent record
    const updatedConsent = await Consent.findByIdAndUpdate(
      consentRecord._id,
      {
        consentGiven: consent,
        timestamp: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    // Get user info for response
    const user = await User.findById(consentRecord.userId);
    
    res.status(200).json({
      success: true,
      data: {
        consent: updatedConsent,
        survey: {
          id: survey._id,
          name: survey.name,
          publishDate: survey.publishDate
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify consent token
// @route   GET /api/consent/:token/verify
// @access  Publish
exports.verifyConsentToken = async (req, res, next) => {
  try {
    // Find consent record by token
    const consentRecord = await Consent.findOne({
      consentToken: req.params.token
    });
    
    if (!consentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Invalid consent token'
      });
    }
    
    // Check if consent deadline has passed
    const survey = await Survey.findById(consentRecord.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }
    
    const deadlinePassed = new Date() > new Date(survey.consentDeadline);
    
    // Get user info for response
    const user = await User.findById(consentRecord.userId);
    
    res.status(200).json({
      success: true,
      data: {
        valid: !deadlinePassed,
        consentGiven: consentRecord.consentGiven,
        deadlinePassed,
        survey: {
          id: survey._id,
          name: survey.name,
          publishDate: survey.publishDate,
          consentDeadline: survey.consentDeadline
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get consent status for a survey
// @route   GET /api/surveys/:surveyId/consent
// @access  Private (Admin only)
exports.getSurveyConsentStatus = async (req, res, next) => {
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
        message: `User ${req.user.id} is not authorized to view consent status for this survey`
      });
    }
    
    // Get consent records with user info
    const consentRecords = await Consent.find({
      surveyId: req.params.surveyId
    }).populate('userId', 'name email department');
    
    // Calculate statistics
    const totalRecords = consentRecords.length;
    const consentGiven = consentRecords.filter(record => record.consentGiven === true).length;
    const consentDenied = consentRecords.filter(record => record.consentGiven === false).length;
    const noResponse = consentRecords.filter(record => record.consentGiven === null).length;
    
    res.status(200).json({
      success: true,
      data: {
        records: consentRecords,
        stats: {
          total: totalRecords,
          consentGiven,
          consentDenied,
          noResponse,
          consentRate: totalRecords > 0 ? (consentGiven / totalRecords) * 100 : 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check if user has given consent for a survey
// @route   GET /api/surveys/:surveyId/consent/check
// @access  Private
exports.checkUserConsent = async (req, res, next) => {
  try {
    const consentRecord = await Consent.findOne({
      surveyId: req.params.surveyId,
      userId: req.user.id
    });
    
    if (!consentRecord) {
      return res.status(404).json({
        success: false,
        message: 'No consent record found for this user and survey'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        consentGiven: consentRecord.consentGiven,
        timestamp: consentRecord.timestamp
      }
    });
  } catch (err) {
    next(err);
  }
};

