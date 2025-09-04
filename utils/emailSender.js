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
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_FROM}`,
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

module.exports = {
  sendEmail,
  sendConsentRequestEmail,
  sendSurveyAvailableEmail,
  sendManagerNotificationEmail,
  sendReporteeNotificationEmail
};

