# Consent Workflow Implementation

This document explains how to implement the consent workflow for the Survey Management System using the MongoDB schema.

## Overview

The consent workflow ensures that:
1. Users are asked for consent before participating in a survey
2. Only consenting users have their identities linked to their responses
3. Non-consenting users can still participate anonymously
4. Consent can only be given before the survey's publish date

## Workflow Steps

### 1. Survey Creation and Consent Request

When an administrator creates a new survey:

```javascript
// 1. Create the survey
const surveyId = createSurvey({
  name: "Employee Satisfaction Survey",
  publishDate: "2025-10-01",
  durationDays: 14,
  department: "Engineering",
  createdBy: "admin"
});

// 2. Upload questions
uploadQuestions(surveyId, questions);

// 3. Generate consent records for target users
const targetUsers = getTargetUsers(surveyId);
generateConsentRecords(surveyId, targetUsers);

// 4. Create notification records for consent requests
createNotifications(surveyId, targetUsers, "consent_request");

// 5. Send consent emails
const consentRecords = db.consents.find({ surveyId: ObjectId(surveyId) }).toArray();
for (const record of consentRecords) {
  sendConsentEmail(record.userId, record.consentToken);
  markNotificationSent(record._id);
  
  // Update consent record to mark email as sent
  db.consents.updateOne(
    { _id: record._id },
    { $set: { emailSent: true, emailSentAt: new Date() } }
  );
}

// 6. Update survey status
updateSurveyStatus(surveyId, "pending_consent");
```

### 2. User Consent Process

When a user clicks on the consent link in their email:

```javascript
// 1. Verify the consent token is valid
function handleConsentRequest(consentToken, userConsentChoice) {
  // Get the consent record
  const consentRecord = db.consents.findOne({ consentToken: consentToken });
  
  if (!consentRecord) {
    return { success: false, message: "Invalid consent token" };
  }
  
  // Check if consent deadline has passed
  const survey = db.surveys.findOne({ _id: consentRecord.surveyId });
  if (new Date() > new Date(survey.consentDeadline)) {
    return { success: false, message: "Consent deadline has passed" };
  }
  
  // Record the user's consent choice
  recordConsent(consentToken, userConsentChoice);
  
  return { 
    success: true, 
    message: userConsentChoice 
      ? "Thank you for consenting to participate in this survey" 
      : "Your preference has been recorded. Your responses will be anonymous"
  };
}
```

### 3. Survey Publication and Notifications

When the survey's publish date arrives:

```javascript
// This would be run by a scheduled job
function processSurveyPublication() {
  const now = new Date();
  
  // Find surveys that should be published today
  const surveysToPublish = db.surveys.find({
    publishDate: { 
      $gte: new Date(now.setHours(0, 0, 0, 0)),
      $lte: new Date(now.setHours(23, 59, 59, 999))
    },
    status: "pending_consent"
  }).toArray();
  
  for (const survey of surveysToPublish) {
    // Update survey status
    updateSurveyStatus(survey._id, "active");
    
    // Get users who need to be notified
    const { consentingUsers, managers, directReports } = await getUsersToNotifyForActiveSurvey(survey._id);
    
    // Create notification records
    createNotifications(survey._id, consentingUsers, "survey_available");
    
    // Create manager notifications
    const managerNotifications = [];
    for (const userId of consentingUsers) {
      const user = db.users.findOne({ _id: userId });
      if (user.managerId) {
        managerNotifications.push({
          userId: user.managerId,
          relatedUserId: userId
        });
      }
    }
    
    if (managerNotifications.length > 0) {
      createNotifications(
        survey._id, 
        managerNotifications.map(n => n.userId),
        "manager_notification",
        managerNotifications.map(n => n.relatedUserId)
      );
    }
    
    // Create reportee notifications
    const reporteeNotifications = [];
    for (const userId of consentingUsers) {
      const user = db.users.findOne({ _id: userId });
      if (user.directReports && user.directReports.length > 0) {
        for (const reporteeId of user.directReports) {
          reporteeNotifications.push({
            userId: reporteeId,
            relatedUserId: userId
          });
        }
      }
    }
    
    if (reporteeNotifications.length > 0) {
      createNotifications(
        survey._id, 
        reporteeNotifications.map(n => n.userId),
        "reportee_notification",
        reporteeNotifications.map(n => n.relatedUserId)
      );
    }
    
    // Send all notifications
    const allNotifications = db.notifications.find({
      surveyId: survey._id,
      sent: false,
      type: { $in: ["survey_available", "manager_notification", "reportee_notification"] }
    }).toArray();
    
    for (const notification of allNotifications) {
      sendSurveyNotificationEmail(notification);
      markNotificationSent(notification._id);
    }
  }
}
```

### 4. Survey Participation with Consent-Based Anonymity

When a user takes the survey:

```javascript
// 1. Start a survey attempt
function startUserSurvey(surveyId, userIdOrNull) {
  // Check if the survey is active
  const survey = db.surveys.findOne({
    _id: ObjectId(surveyId),
    status: "active"
  });
  
  if (!survey) {
    return { success: false, message: "Survey is not active" };
  }
  
  // If user ID is provided, check if they already completed the survey
  if (userIdOrNull) {
    const existingAttempt = hasUserCompletedSurvey(surveyId, userIdOrNull);
    if (existingAttempt) {
      return { success: false, message: "You have already completed this survey" };
    }
  }
  
  // Check if the user has given consent (if user ID is provided)
  let isAnonymous = true;
  if (userIdOrNull) {
    const consentRecord = db.consents.findOne({
      surveyId: ObjectId(surveyId),
      userId: userIdOrNull
    });
    
    isAnonymous = !consentRecord || !consentRecord.consentGiven;
  }
  
  // Create the attempt record
  const attemptId = startSurveyAttempt(
    surveyId, 
    isAnonymous ? null : userIdOrNull
  );
  
  // Get the questions
  const questions = getSurveyQuestions(surveyId);
  
  return {
    success: true,
    attemptId: attemptId,
    questions: questions,
    isAnonymous: isAnonymous
  };
}

// 2. Record user responses
function recordUserResponse(surveyId, questionId, attemptId, userIdOrNull, selectedOption) {
  // Check if the user has given consent
  let isAnonymous = true;
  if (userIdOrNull) {
    const consentRecord = db.consents.findOne({
      surveyId: ObjectId(surveyId),
      userId: userIdOrNull
    });
    
    isAnonymous = !consentRecord || !consentRecord.consentGiven;
  }
  
  // Record the response
  recordResponse(
    surveyId,
    questionId,
    attemptId,
    isAnonymous ? null : userIdOrNull,
    selectedOption
  );
}

// 3. Complete the survey
function completeSurvey(attemptId) {
  completeSurveyAttempt(attemptId);
  return { success: true, message: "Survey completed successfully" };
}
```

### 5. Reporting with Consent-Based Privacy

When generating reports:

```javascript
// 1. Generate a survey-wide report
function generateSurveyReport(surveyId) {
  return exportSurveyResults(surveyId);
}

// 2. Generate a user-specific report
function generateUserReport(surveyId, userId) {
  // Check if the user has given consent
  const consentRecord = db.consents.findOne({
    surveyId: ObjectId(surveyId),
    userId: userId,
    consentGiven: true
  });
  
  if (!consentRecord) {
    return { 
      success: false, 
      message: "Cannot generate user-specific report: User did not give consent or does not exist" 
    };
  }
  
  // Get the user's responses
  const responses = getUserResponses(surveyId, userId);
  
  return {
    success: true,
    userData: {
      userId: userId,
      responses: responses
    }
  };
}
```

## Consent Token Implementation

The consent token system ensures secure and trackable consent:

```javascript
// Generate a unique consent token
function generateUniqueToken() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  // Check if token already exists
  const existingToken = db.consents.findOne({ consentToken: token });
  if (existingToken) {
    // Recursively try again
    return generateUniqueToken();
  }
  
  return token;
}

// Validate a consent token
function validateConsentToken(token) {
  const consentRecord = db.consents.findOne({ consentToken: token });
  
  if (!consentRecord) {
    return { valid: false, message: "Invalid token" };
  }
  
  // Check if consent deadline has passed
  return hasConsentDeadlinePassed(consentRecord.surveyId)
    .then(passed => {
      if (passed) {
        return { valid: false, message: "Consent deadline has passed" };
      }
      
      return { 
        valid: true, 
        surveyId: consentRecord.surveyId,
        userId: consentRecord.userId
      };
    });
}
```

## Email Templates

### Consent Request Email

```html
Subject: Your Consent is Requested: [Survey Name]

Dear [User Name],

You have been invited to participate in the survey "[Survey Name]" which will be published on [Publish Date].

Before the survey begins, we need your consent to associate your responses with your user information. If you do not provide consent, you can still participate anonymously.

[Consent Button: I consent to participate in this survey and have my responses linked to my user information]

[Decline Button: I prefer to participate anonymously]

Please note that this consent request will expire on [Publish Date].

Thank you,
[Organization Name]
```

### Survey Available Email (for consenting users)

```html
Subject: Survey Now Available: [Survey Name]

Dear [User Name],

The survey "[Survey Name]" is now available for your participation. You previously consented to participate in this survey.

[Take Survey Button]

The survey will be available until [End Date].

Thank you,
[Organization Name]
```

### Manager Notification Email

```html
Subject: Your Team Member is Participating in [Survey Name]

Dear [Manager Name],

Your team member [Employee Name] has consented to participate in the survey "[Survey Name]" which is now available.

[View Survey Button]

The survey will be available until [End Date].

Thank you,
[Organization Name]
```

## Security Considerations

1. **Consent Tokens**:
   - One-time use
   - Cryptographically secure
   - Expire after the survey publish date

2. **Data Separation**:
   - User IDs are only stored with responses if consent was given
   - Without consent, responses are stored anonymously

3. **Access Control**:
   - User-specific reports are only available for users who gave consent
   - Anonymous responses cannot be traced back to users

