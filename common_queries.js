// Common MongoDB Queries for Survey Management System

// 1. Create a new survey
function createSurvey(surveyData) {
  debugger;
  const survey = {
    name: surveyData.name,
    publishDate: new Date(surveyData.publishDate),
    durationDays: surveyData.durationDays,
    endDate: new Date(new Date(surveyData.publishDate).getTime() + surveyData.durationDays * 24 * 60 * 60 * 1000),
    department: surveyData.department || null,
    targetEmployees: surveyData.targetEmployees || null,
    createdBy: surveyData.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: "draft",
    consentDeadline: new Date(surveyData.publishDate)
  };
  
  return db.surveys.insertOne(survey);
}

// 2. Upload questions from CSV/Excel
function uploadQuestions(surveyId, questions) {
  const questionDocs = questions.map((q, index) => ({
    surveyId: ObjectId(surveyId),
    questionText: q.questionText,
    options: q.options.filter(opt => opt), // Filter out empty options
    parameter: q.parameter || null,
    order: index + 1
  }));
  
  return db.questions.insertMany(questionDocs);
}

// 3. Get all upcoming surveys (for admin dashboard)
function getUpcomingSurveys() {
  return db.surveys.find({
    publishDate: { $gt: new Date() },
    status: { $in: ["draft", "pending_consent"] }
  }).sort({ publishDate: 1 }).toArray();
}

// 4. Get active surveys (currently open)
function getActiveSurveys() {
  const now = new Date();
  return db.surveys.find({
    publishDate: { $lte: now },
    endDate: { $gte: now },
    status: "active"
  }).sort({ endDate: 1 }).toArray();
}

// 5. Generate consent tokens and create consent records
function generateConsentRecords(surveyId, userIds) {
  const consentRecords = userIds.map(userId => ({
    userId: userId,
    surveyId: ObjectId(surveyId),
    consentGiven: null, // Not yet given
    timestamp: null,
    consentToken: generateUniqueToken(), // Implement this function
    emailSent: false,
    emailSentAt: null
  }));
  
  return db.consents.insertMany(consentRecords);
}

// 6. Record user consent
function recordConsent(consentToken, consentGiven) {
  return db.consents.updateOne(
    { consentToken: consentToken },
    { 
      $set: {
        consentGiven: consentGiven,
        timestamp: new Date()
      }
    }
  );
}

// 7. Get users who have given consent for a survey
function getUsersWithConsent(surveyId) {
  return db.consents.find({
    surveyId: ObjectId(surveyId),
    consentGiven: true
  }).toArray();
}

// 8. Create notification records
function createNotifications(surveyId, userIds, notificationType, relatedUserIds = null) {
  const notifications = userIds.map((userId, index) => ({
    userId: userId,
    surveyId: ObjectId(surveyId),
    type: notificationType,
    sent: false,
    sentAt: null,
    deliveryStatus: "pending",
    relatedToUserId: relatedUserIds ? relatedUserIds[index] : null
  }));
  
  return db.notifications.insertMany(notifications);
}

// 9. Mark notification as sent
function markNotificationSent(notificationId) {
  return db.notifications.updateOne(
    { _id: ObjectId(notificationId) },
    {
      $set: {
        sent: true,
        sentAt: new Date(),
        deliveryStatus: "sent"
      }
    }
  );
}

// 10. Start a survey attempt
function startSurveyAttempt(surveyId, userId = null) {
  const attempt = {
    surveyId: ObjectId(surveyId),
    userId: userId,
    startedAt: new Date(),
    completedAt: null,
    completed: false,
    anonymous: userId === null
  };
  
  return db.surveyAttempts.insertOne(attempt);
}

// 11. Complete a survey attempt
function completeSurveyAttempt(attemptId) {
  return db.surveyAttempts.updateOne(
    { _id: ObjectId(attemptId) },
    {
      $set: {
        completedAt: new Date(),
        completed: true
      }
    }
  );
}

// 12. Record a response
function recordResponse(surveyId, questionId, attemptId, userId, selectedOption) {
  const response = {
    surveyId: ObjectId(surveyId),
    questionId: ObjectId(questionId),
    userId: userId, // null if anonymous
    selectedOption: selectedOption,
    submittedAt: new Date(),
    anonymous: userId === null
  };
  
  return db.responses.insertOne(response);
}

// 13. Get questions for a survey
function getSurveyQuestions(surveyId) {
  return db.questions.find({
    surveyId: ObjectId(surveyId)
  }).sort({ order: 1 }).toArray();
}

// 14. Check if a user has already completed a survey
function hasUserCompletedSurvey(surveyId, userId) {
  return db.surveyAttempts.findOne({
    surveyId: ObjectId(surveyId),
    userId: userId,
    completed: true
  });
}

// 15. Get survey participation statistics
function getSurveyParticipationStats(surveyId) {
  return db.surveyAttempts.aggregate([
    { $match: { surveyId: ObjectId(surveyId) } },
    { $group: {
        _id: "$surveyId",
        totalAttempts: { $sum: 1 },
        completedAttempts: { $sum: { $cond: ["$completed", 1, 0] } },
        identifiedUsers: { $sum: { $cond: [{ $ne: ["$userId", null] }, 1, 0] } },
        anonymousUsers: { $sum: { $cond: ["$anonymous", 1, 0] } }
      }
    }
  ]).toArray();
}

// 16. Get response distribution for a question
function getQuestionResponseDistribution(surveyId, questionId) {
  return db.responses.aggregate([
    { $match: { 
        surveyId: ObjectId(surveyId), 
        questionId: ObjectId(questionId) 
      } 
    },
    { $group: {
        _id: "$selectedOption",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
}

// 17. Get all responses for a user (only if they gave consent)
function getUserResponses(surveyId, userId) {
  // First check if user gave consent
  return db.consents.findOne({
    surveyId: ObjectId(surveyId),
    userId: userId,
    consentGiven: true
  }).then(consent => {
    if (!consent) {
      throw new Error("User did not give consent or does not exist");
    }
    
    return db.responses.aggregate([
      { $match: { 
          surveyId: ObjectId(surveyId), 
          userId: userId 
        } 
      },
      { $lookup: {
          from: "questions",
          localField: "questionId",
          foreignField: "_id",
          as: "question"
        }
      },
      { $unwind: "$question" },
      { $project: {
          questionText: "$question.questionText",
          selectedOption: 1,
          submittedAt: 1
        }
      },
      { $sort: { submittedAt: 1 } }
    ]).toArray();
  });
}

// 18. Get parameter-based analysis
function getParameterAnalysis(surveyId, parameter) {
  return db.responses.aggregate([
    { $lookup: {
        from: "questions",
        localField: "questionId",
        foreignField: "_id",
        as: "questionData"
      }
    },
    { $unwind: "$questionData" },
    { $match: { 
        surveyId: ObjectId(surveyId),
        "questionData.parameter": parameter
      }
    },
    { $group: {
        _id: {
          question: "$questionData.questionText",
          option: "$selectedOption"
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.question": 1, count: -1 } }
  ]).toArray();
}

// 19. Update survey status
function updateSurveyStatus(surveyId, status) {
  return db.surveys.updateOne(
    { _id: ObjectId(surveyId) },
    {
      $set: {
        status: status,
        updatedAt: new Date()
      }
    }
  );
}

// 20. Automatically update survey statuses based on dates
function updateSurveyStatuses() {
  const now = new Date();
  
  // Update surveys that should be active
  db.surveys.updateMany(
    {
      publishDate: { $lte: now },
      endDate: { $gte: now },
      status: "pending_consent"
    },
    {
      $set: {
        status: "active",
        updatedAt: new Date()
      }
    }
  );
  
  // Update surveys that have ended
  db.surveys.updateMany(
    {
      endDate: { $lt: now },
      status: "active"
    },
    {
      $set: {
        status: "completed",
        updatedAt: new Date()
      }
    }
  );
}

// 21. Get users who need to be notified when a survey becomes active
async function getUsersToNotifyForActiveSurvey(surveyId) {
  // Get users who gave consent
  const consentingUsers = await db.consents.find({
    surveyId: ObjectId(surveyId),
    consentGiven: true
  }).toArray();
  
  const userIds = consentingUsers.map(c => c.userId);
  
  // Get their managers
  const managers = await db.users.find({
    _id: { $in: userIds }
  }).toArray().then(users => 
    users.map(u => u.managerId).filter(id => id)
  );
  
  // Get their direct reports
  const directReports = await db.users.find({
    _id: { $in: userIds }
  }).toArray().then(users => 
    users.flatMap(u => u.directReports).filter(id => id)
  );
  
  return {
    consentingUsers: userIds,
    managers: [...new Set(managers)],
    directReports: [...new Set(directReports)]
  };
}

// 22. Export survey results to JSON (for PDF/Excel generation)
async function exportSurveyResults(surveyId) {
  const survey = await db.surveys.findOne({ _id: ObjectId(surveyId) });
  const questions = await db.questions.find({ surveyId: ObjectId(surveyId) }).sort({ order: 1 }).toArray();
  
  const stats = await getSurveyParticipationStats(surveyId);
  
  const questionResults = await Promise.all(
    questions.map(async question => {
      const distribution = await getQuestionResponseDistribution(surveyId, question._id);
      return {
        questionText: question.questionText,
        parameter: question.parameter,
        options: question.options,
        distribution: distribution
      };
    })
  );
  
  // Get parameter-based results
  const parameters = [...new Set(questions.map(q => q.parameter).filter(p => p))];
  const parameterResults = await Promise.all(
    parameters.map(async param => {
      const analysis = await getParameterAnalysis(surveyId, param);
      return {
        parameter: param,
        analysis: analysis
      };
    })
  );
  
  return {
    survey: {
      name: survey.name,
      publishDate: survey.publishDate,
      endDate: survey.endDate,
      department: survey.department,
      status: survey.status
    },
    statistics: stats[0] || {
      totalAttempts: 0,
      completedAttempts: 0,
      identifiedUsers: 0,
      anonymousUsers: 0
    },
    questionResults: questionResults,
    parameterResults: parameterResults
  };
}

// 23. Get consent status for all users for a survey
function getSurveyConsentStatus(surveyId) {
  return db.consents.aggregate([
    { $match: { surveyId: ObjectId(surveyId) } },
    { $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userData"
      }
    },
    { $unwind: "$userData" },
    { $project: {
        userId: 1,
        userName: "$userData.name",
        userEmail: "$userData.email",
        department: "$userData.department",
        consentGiven: 1,
        timestamp: 1,
        emailSent: 1,
        emailSentAt: 1
      }
    },
    { $sort: { department: 1, userName: 1 } }
  ]).toArray();
}

// 24. Check if consent deadline has passed
function hasConsentDeadlinePassed(surveyId) {
  return db.surveys.findOne({
    _id: ObjectId(surveyId)
  }).then(survey => {
    if (!survey) {
      throw new Error("Survey not found");
    }
    return new Date() > new Date(survey.consentDeadline);
  });
}

// 25. Get all surveys for a specific department
function getDepartmentSurveys(department) {
  return db.surveys.find({
    $or: [
      { department: department },
      { department: null } // Surveys for all departments
    ]
  }).sort({ publishDate: -1 }).toArray();
}

