const nodemailer = require('nodemailer');

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text content
 * @param {String} options.html - HTML content
 */
const sendEmail = async (options) => {
  // Check if email configuration is available
  if (!process.env.EMAIL_SERVICE && !process.env.EMAIL_HOST) {
    console.warn('Email configuration not found. Email functionality is disabled.');
    console.warn('Please create a .env file with email configuration. See .env.example for reference.');
    throw new Error('Email service not configured. Please check your environment variables.');
  }

  // Create transporter configuration
  let transporterConfig;
  
  if (process.env.EMAIL_SERVICE) {
    // Use predefined service (Gmail, Outlook, etc.)
    transporterConfig = {
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    };
  } else if (process.env.EMAIL_HOST) {
    // Use custom SMTP configuration
    transporterConfig = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    };
  }

  // Create a transporter
  const transporter = nodemailer.createTransport(transporterConfig);

  // Define email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
    to: options.to,
    subject: options.subject,
    text: options.text || '',
    html: options.html || ''
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  
  return info;
};

/**
 * Send consent request email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.userName - User's name
 * @param {String} options.surveyName - Survey name
 * @param {Date} options.publishDate - Survey publish date
 * @param {String} options.consentToken - Consent token for verification
 */
const sendConsentRequestEmail = async (options) => {
  const consentUrl = `${process.env.FRONTEND_URL}/consent/${options.consentToken}`;
  
  const html = `
    <h1>Your Consent is Requested: ${options.surveyName}</h1>
    <p>Dear ${options.userName},</p>
    <p>You have been invited to participate in the survey "${options.surveyName}" which will be published on ${new Date(options.publishDate).toLocaleDateString()}.</p>
    <p>Before the survey begins, we need your consent to associate your responses with your user information. If you do not provide consent, you can still participate anonymously.</p>
    <div style="margin: 20px 0;">
      <a href="${consentUrl}?consent=true" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; margin-right: 10px;">I consent to participate</a>
      <a href="${consentUrl}?consent=false" style="background-color: #f44336; color: white; padding: 10px 15px; text-decoration: none;">I prefer to participate anonymously</a>
    </div>
    <p>Please note that this consent request will expire on ${new Date(options.publishDate).toLocaleDateString()}.</p>
    <p>Thank you,<br>Survey Management System</p>
  `;
  
  return sendEmail({
    to: options.to,
    subject: `Your Consent is Requested: ${options.surveyName}`,
    html
  });
};

/**
 * Send survey available email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.userName - User's name
 * @param {String} options.surveyName - Survey name
 * @param {Date} options.endDate - Survey end date
 * @param {String} options.surveyId - Survey ID
 */
const sendSurveyAvailableEmail = async (options) => {
  const surveyUrl = `${process.env.FRONTEND_URL}/surveys/${options.surveyId}`;
  
  const html = `
    <h1>Survey Now Available: ${options.surveyName}</h1>
    <p>Dear ${options.userName},</p>
    <p>The survey "${options.surveyName}" is now available for your participation. You previously consented to participate in this survey.</p>
    <div style="margin: 20px 0;">
      <a href="${surveyUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none;">Take Survey</a>
    </div>
    <p>The survey will be available until ${new Date(options.endDate).toLocaleDateString()}.</p>
    <p>Thank you,<br>Survey Management System</p>
  `;
  
  return sendEmail({
    to: options.to,
    subject: `Survey Now Available: ${options.surveyName}`,
    html
  });
};

/**
 * Send manager notification email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email (manager)
 * @param {String} options.managerName - Manager's name
 * @param {String} options.employeeName - Employee's name
 * @param {String} options.surveyName - Survey name
 * @param {Date} options.endDate - Survey end date
 * @param {String} options.surveyId - Survey ID
 */
const sendManagerNotificationEmail = async (options) => {
  const surveyUrl = `${process.env.FRONTEND_URL}/surveys/${options.surveyId}`;
  
  const html = `
    <h1>Your Team Member is Participating in ${options.surveyName}</h1>
    <p>Dear ${options.managerName},</p>
    <p>Your team member ${options.employeeName} has consented to participate in the survey "${options.surveyName}" which is now available.</p>
    <div style="margin: 20px 0;">
      <a href="${surveyUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none;">View Survey</a>
    </div>
    <p>The survey will be available until ${new Date(options.endDate).toLocaleDateString()}.</p>
    <p>Thank you,<br>Survey Management System</p>
  `;
  
  return sendEmail({
    to: options.to,
    subject: `Your Team Member is Participating in ${options.surveyName}`,
    html
  });
};

/**
 * Send reportee notification email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email (reportee)
 * @param {String} options.reporteeName - Reportee's name
 * @param {String} options.managerName - Manager's name
 * @param {String} options.surveyName - Survey name
 * @param {Date} options.endDate - Survey end date
 * @param {String} options.surveyId - Survey ID
 */
const sendReporteeNotificationEmail = async (options) => {
  const surveyUrl = `${process.env.FRONTEND_URL}/surveys/${options.surveyId}`;
  
  const html = `
    <h1>Your Manager is Participating in ${options.surveyName}</h1>
    <p>Dear ${options.reporteeName},</p>
    <p>Your manager ${options.managerName} has consented to participate in the survey "${options.surveyName}" which is now available.</p>
    <div style="margin: 20px 0;">
      <a href="${surveyUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none;">View Survey</a>
    </div>
    <p>The survey will be available until ${new Date(options.endDate).toLocaleDateString()}.</p>
    <p>Thank you,<br>Survey Management System</p>
  `;
  
  return sendEmail({
    to: options.to,
    subject: `Your Manager is Participating in ${options.surveyName}`,
    html
  });
};

/**
 * Send survey invitation email with direct survey link
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.employeeName - Employee's name
 * @param {String} options.surveyName - Survey name
 * @param {String} options.surveyDescription - Survey description
 * @param {String} options.surveyLink - Direct link to take the survey
 * @param {Date} options.dueDate - Survey due date
 * @param {String} options.departmentName - Employee's department name
 */
const sendSurveyInvitationEmail = async (options) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Survey Invitation: ${options.surveyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .survey-info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2; }
        .cta-button { display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .cta-button:hover { background-color: #45a049; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .important { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Survey Invitation</h1>
        <p>You're invited to participate in: <strong>${options.surveyName}</strong></p>
      </div>
      
      <div class="content">
        <p>Dear <strong>${options.employeeName}</strong>,</p>
        
        <p>You have been selected to participate in an important survey. Your feedback is valuable and will help us improve our organization.</p>
        
        <div class="survey-info">
          <h3>📊 Survey Details</h3>
          <p><strong>Survey Name:</strong> ${options.surveyName}</p>
          ${options.surveyDescription ? `<p><strong>Description:</strong> ${options.surveyDescription}</p>` : ''}
          <p><strong>Your Department:</strong> ${options.departmentName || 'Not specified'}</p>
          ${options.dueDate ? `<p><strong>Due Date:</strong> ${new Date(options.dueDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>` : ''}
        </div>
        
        <div class="important">
          <h4>🔒 Privacy & Confidentiality</h4>
          <p>• Your responses will be kept confidential</p>
          <p>• Individual responses will not be shared</p>
          <p>• Only aggregated data will be used for analysis</p>
          <p>• Participation is voluntary</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${options.surveyLink}" class="cta-button">🚀 Take Survey Now</a>
        </div>
        
        <p><strong>Survey Link:</strong> <a href="${options.surveyLink}">${options.surveyLink}</a></p>
        
        <div class="important">
          <h4>⏰ Important Notes</h4>
          <p>• Please complete the survey by the due date</p>
          <p>• The survey should take approximately 10-15 minutes</p>
          <p>• You can save your progress and return later</p>
          <p>• Contact your administrator if you have any questions</p>
        </div>
        
        <p>Thank you for your time and participation!</p>
        
        <div class="footer">
          <p>This email was sent by the Survey Management System</p>
          <p>If you have any technical issues, please contact your system administrator</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `
Survey Invitation: ${options.surveyName}

Dear ${options.employeeName},

You have been selected to participate in the survey "${options.surveyName}".

Survey Details:
- Survey Name: ${options.surveyName}
${options.surveyDescription ? `- Description: ${options.surveyDescription}` : ''}
- Your Department: ${options.departmentName || 'Not specified'}
${options.dueDate ? `- Due Date: ${new Date(options.dueDate).toLocaleDateString()}` : ''}

To take the survey, please visit: ${options.surveyLink}

Your responses will be kept confidential and participation is voluntary.

Thank you for your time and participation!

Survey Management System
  `;
  
  return sendEmail({
    to: options.to,
    subject: `📋 Survey Invitation: ${options.surveyName}`,
    html,
    text: textContent
  });
};

module.exports = {
  sendEmail,
  sendConsentRequestEmail,
  sendSurveyAvailableEmail,
  sendManagerNotificationEmail,
  sendReporteeNotificationEmail,
  sendSurveyInvitationEmail
};
