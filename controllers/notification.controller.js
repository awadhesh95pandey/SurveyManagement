const Notification = require('../models/Notification');
const Survey = require('../models/Survey');
const User = require('../models/User');
const Consent = require('../models/Consent');
const { 
  sendSurveyAvailableEmail, 
  sendManagerNotificationEmail, 
  sendReporteeNotificationEmail 
} = require('../utils/emailSender');

// @desc    Send notifications for active survey
// @route   POST /api/surveys/:surveyId/send-notifications
// @access  Private (Admin only)
exports.sendSurveyNotifications = async (req, res, next) => {
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
        message: `User ${req.user.id} is not authorized to send notifications for this survey`
      });
    }
    
    // Check if survey is active
    if (survey.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Survey must be active to send notifications'
      });
    }
    
    // Get users who gave consent
    const consentingUsers = await Consent.find({
      surveyId: req.params.surveyId,
      consentGiven: true
    });
    
    if (consentingUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users have given consent for this survey'
      });
    }
    
    const consentingUserIds = consentingUsers.map(c => c.userId);
    
    // Get user details
    const users = await User.find({
      _id: { $in: consentingUserIds }
    });
    
    // Create notification records and send emails
    const notifications = [];
    const emailResults = [];
    
    // 1. Send notifications to consenting users
    for (const user of users) {
      // Create notification record
      const notification = await Notification.create({
        userId: user._id,
        surveyId: req.params.surveyId,
        type: 'survey_available',
        sent: false,
        deliveryStatus: 'pending'
      });
      
      notifications.push(notification);
      
      // Send email
      try {
        const emailResult = await sendSurveyAvailableEmail({
          to: user.email,
          userName: user.name,
          surveyName: survey.name,
          endDate: survey.endDate,
          surveyId: survey._id
        });
        
        emailResults.push({
          userId: user._id,
          type: 'survey_available',
          success: true,
          messageId: emailResult.messageId
        });
        
        // Update notification record
        await Notification.findByIdAndUpdate(notification._id, {
          sent: true,
          sentAt: Date.now(),
          deliveryStatus: 'sent'
        });
      } catch (error) {
        console.error(`Failed to send survey available email to ${user.email}:`, error);
        
        emailResults.push({
          userId: user._id,
          type: 'survey_available',
          success: false,
          error: error.message
        });
        
        // Update notification record
        await Notification.findByIdAndUpdate(notification._id, {
          sent: false,
          deliveryStatus: 'failed'
        });
      }
    }
    
    // 2. Send notifications to managers of consenting users
    for (const user of users) {
      if (user.managerId) {
        const manager = await User.findById(user.managerId);
        
        if (manager) {
          // Create notification record
          const notification = await Notification.create({
            userId: manager._id,
            surveyId: req.params.surveyId,
            type: 'manager_notification',
            sent: false,
            deliveryStatus: 'pending',
            relatedToUserId: user._id
          });
          
          notifications.push(notification);
          
          // Send email
          try {
            const emailResult = await sendManagerNotificationEmail({
              to: manager.email,
              managerName: manager.name,
              employeeName: user.name,
              surveyName: survey.name,
              endDate: survey.endDate,
              surveyId: survey._id
            });
            
            emailResults.push({
              userId: manager._id,
              type: 'manager_notification',
              success: true,
              messageId: emailResult.messageId
            });
            
            // Update notification record
            await Notification.findByIdAndUpdate(notification._id, {
              sent: true,
              sentAt: Date.now(),
              deliveryStatus: 'sent'
            });
          } catch (error) {
            console.error(`Failed to send manager notification email to ${manager.email}:`, error);
            
            emailResults.push({
              userId: manager._id,
              type: 'manager_notification',
              success: false,
              error: error.message
            });
            
            // Update notification record
            await Notification.findByIdAndUpdate(notification._id, {
              sent: false,
              deliveryStatus: 'failed'
            });
          }
        }
      }
    }
    
    // 3. Send notifications to direct reports of consenting users
    for (const user of users) {
      if (user.directReports && user.directReports.length > 0) {
        const reportees = await User.find({
          _id: { $in: user.directReports }
        });
        
        for (const reportee of reportees) {
          // Create notification record
          const notification = await Notification.create({
            userId: reportee._id,
            surveyId: req.params.surveyId,
            type: 'reportee_notification',
            sent: false,
            deliveryStatus: 'pending',
            relatedToUserId: user._id
          });
          
          notifications.push(notification);
          
          // Send email
          try {
            const emailResult = await sendReporteeNotificationEmail({
              to: reportee.email,
              reporteeName: reportee.name,
              managerName: user.name,
              surveyName: survey.name,
              endDate: survey.endDate,
              surveyId: survey._id
            });
            
            emailResults.push({
              userId: reportee._id,
              type: 'reportee_notification',
              success: true,
              messageId: emailResult.messageId
            });
            
            // Update notification record
            await Notification.findByIdAndUpdate(notification._id, {
              sent: true,
              sentAt: Date.now(),
              deliveryStatus: 'sent'
            });
          } catch (error) {
            console.error(`Failed to send reportee notification email to ${reportee.email}:`, error);
            
            emailResults.push({
              userId: reportee._id,
              type: 'reportee_notification',
              success: false,
              error: error.message
            });
            
            // Update notification record
            await Notification.findByIdAndUpdate(notification._id, {
              sent: false,
              deliveryStatus: 'failed'
            });
          }
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        notifications,
        emailResults,
        stats: {
          total: emailResults.length,
          success: emailResults.filter(r => r.success).length,
          failed: emailResults.filter(r => !r.success).length
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get notifications for a survey
// @route   GET /api/surveys/:surveyId/notifications
// @access  Private (Admin only)
exports.getSurveyNotifications = async (req, res, next) => {
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
        message: `User ${req.user.id} is not authorized to view notifications for this survey`
      });
    }
    
    // Get notifications with user info
    const notifications = await Notification.find({
      surveyId: req.params.surveyId
    }).populate('userId', 'name email department');
    
    // Group by type
    const groupedNotifications = {
      consent_request: notifications.filter(n => n.type === 'consent_request'),
      survey_available: notifications.filter(n => n.type === 'survey_available'),
      manager_notification: notifications.filter(n => n.type === 'manager_notification'),
      reportee_notification: notifications.filter(n => n.type === 'reportee_notification')
    };
    
    // Calculate statistics
    const stats = {
      total: notifications.length,
      sent: notifications.filter(n => n.sent).length,
      pending: notifications.filter(n => !n.sent).length,
      byType: {
        consent_request: groupedNotifications.consent_request.length,
        survey_available: groupedNotifications.survey_available.length,
        manager_notification: groupedNotifications.manager_notification.length,
        reportee_notification: groupedNotifications.reportee_notification.length
      }
    };
    
    res.status(200).json({
      success: true,
      data: {
        notifications: groupedNotifications,
        stats
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res, next) => {
  try {
    // Get notifications for the current user
    const notifications = await Notification.find({
      userId: req.user.id
    }).populate('surveyId', 'name publishDate endDate');
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: `Notification not found with id of ${req.params.id}`
      });
    }
    
    // Make sure notification belongs to the current user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this notification`
      });
    }
    
    // Update notification
    const updatedNotification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
        readAt: new Date(),
        deliveryStatus: 'opened'
      },
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: updatedNotification
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: `Notification not found with id of ${req.params.id}`
      });
    }
    
    // Make sure notification belongs to the current user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this notification`
      });
    }
    
    // Delete notification
    await Notification.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    // Update all unread notifications for the current user
    const result = await Notification.updateMany(
      {
        userId: req.user.id,
        read: false
      },
      {
        read: true,
        readAt: new Date(),
        deliveryStatus: 'opened'
      }
    );
    
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (err) {
    next(err);
  }
};
