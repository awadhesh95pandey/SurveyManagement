const Survey = require('../models/Survey');
const Question = require('../models/Question');
const Consent = require('../models/Consent');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendConsentRequestEmail } = require('../utils/emailSender');

// Helper function to get target users for a survey
const getTargetUsers = async (survey) => {
  let targetUsers = [];
  
  if (survey.targetEmployees && survey.targetEmployees.length > 0) {
    // If specific employees are targeted
    targetUsers = await User.find({
      _id: { $in: survey.targetEmployees },
      isActive: true
    }).select('_id name email department role');
  } else if (survey.department) {
    // If a department is targeted, fetch all employees from that department
    targetUsers = await User.find({
      department: survey.department,
      isActive: true,
      role: { $in: ['employee', 'manager'] }
    }).select('_id name email department role');
  } else {
    // If all employees are targeted
    targetUsers = await User.find({
      role: { $in: ['employee', 'manager'] },
      isActive: true
    }).select('_id name email department role');
  }
  
  return targetUsers;
};

// @desc    Create new survey
// @route   POST /api/surveys
// @access  Private (Admin only)
exports.createSurvey = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;
    
    // Set duration days (endDate will be calculated as virtual field)
    const publishDate = new Date(req.body.publishDate);
    const durationDays = req.body.durationDays || req.body.noOfDays || 7;
    req.body.durationDays = durationDays;
    
    // Set consent deadline to publish date
    req.body.consentDeadline = publishDate;
    
    // Validate that we have either targetEmployees or department
    if (!req.body.targetEmployees && !req.body.department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either target employees or a department'
      });
    }
    
    // Create survey
    const survey = await Survey.create(req.body);
    
    // Get target users for consent generation
    const targetUsers = await getTargetUsers(survey);
    
    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active users found for the specified target criteria'
      });
    }
    
    // If department was specified but no specific targetEmployees, populate targetEmployees with department users
    if (survey.department && (!survey.targetEmployees || survey.targetEmployees.length === 0)) {
      survey.targetEmployees = targetUsers.map(user => user._id);
      await Survey.findByIdAndUpdate(survey._id, { 
        targetEmployees: survey.targetEmployees 
      });
    }
    
    // Generate consent records and send emails
    const consentRecords = [];
    const notificationRecords = [];
    const emailResults = {
      sent: 0,
      failed: 0,
      errors: []
    };
    
    for (const user of targetUsers) {
      try {
        // Generate unique consent token
        const consentToken = require('crypto').randomBytes(32).toString('hex');
        
        // Create consent record
        const consentRecord = await Consent.create({
          userId: user._id,
          surveyId: survey._id,
          consentGiven: null,
          consentTimestamp: null,
          consentToken: consentToken,
          emailSent: false,
          emailSentAt: null
        });
        
        consentRecords.push(consentRecord);
        
        // Create notification record
        const notificationRecord = await Notification.create({
          userId: user._id,
          surveyId: survey._id,
          type: 'consent_request',
          sent: false,
          sentAt: null,
          deliveryStatus: 'pending'
        });
        
        notificationRecords.push(notificationRecord);
        
        // Send consent email
        try {
          await sendConsentRequestEmail({
            to: user.email,
            userName: user.name,
            surveyName: survey.name,
            publishDate: survey.publishDate,
            consentToken: consentRecord.consentToken
          });
          
          // Update consent record and notification
          await Consent.findByIdAndUpdate(consentRecord._id, {
            emailSent: true,
            emailSentAt: Date.now()
          });
          
          await Notification.findByIdAndUpdate(notificationRecord._id, {
            sent: true,
            sentAt: Date.now(),
            deliveryStatus: 'sent'
          });
          
          emailResults.sent++;
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
          emailResults.failed++;
          emailResults.errors.push({
            email: user.email,
            error: emailError.message
          });
        }
      } catch (recordError) {
        console.error(`Failed to create records for user ${user._id}:`, recordError);
        emailResults.failed++;
        emailResults.errors.push({
          userId: user._id,
          email: user.email,
          error: recordError.message
        });
      }
    }
    
    // Update survey status to pending_consent
    await Survey.findByIdAndUpdate(
      survey._id,
      { status: 'pending_consent', updatedAt: Date.now() }
    );
    
    // Get updated survey with new status
    const updatedSurvey = await Survey.findById(survey._id);
    
    res.status(201).json({
      success: true,
      data: updatedSurvey,
      consentProcess: {
        targetUsersCount: targetUsers.length,
        consentRecordsCreated: consentRecords.length,
        emailResults: emailResults
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all surveys
// @route   GET /api/surveys
// @access  Private
exports.getSurveys = async (req, res, next) => {
  try {
    let query;
    
    // Copy req.query
    const reqQuery = { ...req.query };
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    
    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Finding resource
    query = Survey.find(JSON.parse(queryStr));
    
    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Survey.countDocuments();
    
    query = query.skip(startIndex).limit(limit);
    
    // Executing query
    const surveys = await query;
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: surveys.length,
      pagination,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single survey
// @route   GET /api/surveys/:id
// @access  Private
exports.getSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.id}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: survey
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update survey
// @route   PUT /api/surveys/:id
// @access  Private (Admin only)
exports.updateSurvey = async (req, res, next) => {
  try {
    let survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is survey creator or admin
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this survey`
      });
    }
    
    // Don't allow updating status directly
    if (req.body.status) {
      delete req.body.status;
    }
    
    // Update survey
    survey = await Survey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: survey
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete survey
// @route   DELETE /api/surveys/:id
// @access  Private (Admin only)
exports.deleteSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is survey creator or admin
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this survey`
      });
    }
    
    // Delete related data
    await Question.deleteMany({ surveyId: req.params.id });
    await Consent.deleteMany({ surveyId: req.params.id });
    await Notification.deleteMany({ surveyId: req.params.id });
    
    // Delete survey
    await survey.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get upcoming surveys
// @route   GET /api/surveys/upcoming
// @access  Private
exports.getUpcomingSurveys = async (req, res, next) => {
  try {
    const surveys = await Survey.find({
      publishDate: { $gt: new Date() },
      status: { $in: ['draft', 'pending_consent'] }
    }).sort({ publishDate: 1 });
    
    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active surveys
// @route   GET /api/surveys/active
// @access  Private
exports.getActiveSurveys = async (req, res, next) => {
  try {
    const now = new Date();
    
    const surveys = await Survey.find({
      publishDate: { $lte: now },
      endDate: { $gte: now },
      status: 'active'
    }).sort({ endDate: 1 });
    
    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update survey status
// @route   PUT /api/surveys/:id/status
// @access  Private (Admin only)
exports.updateSurveyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status'
      });
    }
    
    let survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is survey creator or admin
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this survey`
      });
    }
    
    // Update survey status
    survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: survey
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate consent records for a survey
// @route   POST /api/surveys/:id/generate-consent
// @access  Private (Admin only)
exports.generateConsentRecords = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: `Survey not found with id of ${req.params.id}`
      });
    }
    
    // Make sure user is survey creator or admin
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to generate consent records for this survey`
      });
    }
    
    // Get target users
    const targetUsers = await getTargetUsers(survey);
    
    // Create consent records
    const consentRecords = [];
    const notificationRecords = [];
    
    for (const user of targetUsers) {
      // Generate unique consent token
      const consentToken = require('crypto').randomBytes(32).toString('hex');
      
      // Create consent record
      const consentRecord = await Consent.create({
        userId: user._id,
        surveyId: survey._id,
        consentGiven: null,
        consentTimestamp: null,
        consentToken: consentToken,
        emailSent: false,
        emailSentAt: null
      });
      
      consentRecords.push(consentRecord);
      
      // Create notification record
      const notificationRecord = await Notification.create({
        userId: user._id,
        surveyId: survey._id,
        type: 'consent_request',
        sent: false,
        sentAt: null,
        deliveryStatus: 'pending'
      });
      
      notificationRecords.push(notificationRecord);
      
      // Send consent email
      try {
        await sendConsentRequestEmail({
          to: user.email,
          userName: user.name,
          surveyName: survey.name,
          publishDate: survey.publishDate,
          consentToken: consentRecord.consentToken
        });
        
        // Update consent record and notification
        await Consent.findByIdAndUpdate(consentRecord._id, {
          emailSent: true,
          emailSentAt: Date.now()
        });
        
        await Notification.findByIdAndUpdate(notificationRecord._id, {
          sent: true,
          sentAt: Date.now(),
          deliveryStatus: 'sent'
        });
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
      }
    }
    
    // Update survey status
    await Survey.findByIdAndUpdate(
      req.params.id,
      { status: 'pending_consent', updatedAt: Date.now() }
    );
    
    res.status(200).json({
      success: true,
      count: consentRecords.length,
      data: {
        consentRecords,
        notificationRecords
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Automatically update survey statuses based on dates
// @route   GET /api/surveys/update-statuses
// @access  Private (Admin only)
exports.updateSurveyStatuses = async (req, res, next) => {
  try {
    const now = new Date();
    
    // Update surveys that should be active
    const activatedSurveys = await Survey.updateMany(
      {
        publishDate: { $lte: now },
        endDate: { $gte: now },
        status: 'pending_consent'
      },
      {
        $set: {
          status: 'active',
          updatedAt: now
        }
      }
    );
    
    // Update surveys that have ended
    const completedSurveys = await Survey.updateMany(
      {
        endDate: { $lt: now },
        status: 'active'
      },
      {
        $set: {
          status: 'completed',
          updatedAt: now
        }
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        activated: activatedSurveys.nModified,
        completed: completedSurveys.nModified
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get consent status for a survey (admin)
// @route   GET /api/surveys/:id/consent/status
// @access  Private (Admin only)
exports.getConsentStatus = async (req, res, next) => {
  try {
    const surveyId = req.params.id;

    // Find all consent records for this survey
    const consentRecords = await Consent.find({ surveyId })
      .populate('userId', 'name email department');

    res.status(200).json({
      success: true,
      data: consentRecords
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all employees for survey targeting
// @route   GET /api/employees
// @access  Private (Admin only)
exports.getEmployees = async (req, res, next) => {
  try {
    const { department } = req.query;
    
    let query = {
      role: { $in: ['employee', 'manager'] },
      isActive: true
    };
    
    // Filter by department if specified
    if (department && department !== 'All Departments') {
      query.department = department;
    }
    
    const employees = await User.find(query)
      .select('_id name email department role')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (Admin only)
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await User.distinct('department', {
      role: { $in: ['employee', 'manager'] },
      isActive: true
    });
    
    // Add "All Departments" option
    const departmentList = ['All Departments', ...departments.filter(dept => dept)];

    res.status(200).json({
      success: true,
      count: departmentList.length,
      data: departmentList
    });
  } catch (err) {
    next(err);
  }
};
