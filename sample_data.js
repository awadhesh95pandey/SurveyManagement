// Sample data for Survey Management System

// Sample Users
const users = [
  {
    _id: ObjectId(),
    email: "admin@example.com",
    name: "Admin User",
    department: "Administration",
    role: "admin",
    managerId: null,
    directReports: ["emp1", "emp2"]
  },
  {
    _id: ObjectId(),
    email: "manager@example.com",
    name: "Manager User",
    department: "Engineering",
    role: "manager",
    managerId: "admin",
    directReports: ["emp3", "emp4"]
  },
  {
    _id: "emp1",
    email: "employee1@example.com",
    name: "Employee One",
    department: "Engineering",
    role: "employee",
    managerId: "admin",
    directReports: []
  },
  {
    _id: "emp2",
    email: "employee2@example.com",
    name: "Employee Two",
    department: "Marketing",
    role: "employee",
    managerId: "admin",
    directReports: []
  },
  {
    _id: "emp3",
    email: "employee3@example.com",
    name: "Employee Three",
    department: "Engineering",
    role: "employee",
    managerId: "manager",
    directReports: []
  },
  {
    _id: "emp4",
    email: "employee4@example.com",
    name: "Employee Four",
    department: "Engineering",
    role: "employee",
    managerId: "manager",
    directReports: []
  }
];

// Insert users
db.users.insertMany(users);

// Sample Survey
const surveyId = ObjectId();
const survey = {
  _id: surveyId,
  name: "Employee Satisfaction Survey",
  publishDate: new Date("2025-10-01"),
  durationDays: 14,
  endDate: new Date("2025-10-15"),
  department: "Engineering",
  targetEmployees: null, // Target all employees in Engineering
  createdBy: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  status: "pending_consent",
  consentDeadline: new Date("2025-10-01")
};

// Insert survey
db.surveys.insertOne(survey);

// Sample Questions
const questions = [
  {
    _id: ObjectId(),
    surveyId: surveyId,
    questionText: "How satisfied are you with your work environment?",
    options: [
      "Very Satisfied",
      "Satisfied",
      "Neutral",
      "Dissatisfied"
    ],
    parameter: "Work Environment",
    order: 1
  },
  {
    _id: ObjectId(),
    surveyId: surveyId,
    questionText: "How would you rate the work-life balance in your role?",
    options: [
      "Excellent",
      "Good",
      "Fair",
      "Poor"
    ],
    parameter: "Work-Life Balance",
    order: 2
  },
  {
    _id: ObjectId(),
    surveyId: surveyId,
    questionText: "Do you feel your contributions are valued?",
    options: [
      "Always",
      "Often",
      "Sometimes",
      "Rarely"
    ],
    parameter: "Recognition",
    order: 3
  }
];

// Insert questions
db.questions.insertMany(questions);

// Sample Consents
const consents = [
  {
    userId: "emp1",
    surveyId: surveyId,
    consentGiven: true,
    timestamp: new Date("2025-09-15"),
    consentToken: "token123",
    emailSent: true,
    emailSentAt: new Date("2025-09-10")
  },
  {
    userId: "emp2",
    surveyId: surveyId,
    consentGiven: false,
    timestamp: new Date("2025-09-16"),
    consentToken: "token456",
    emailSent: true,
    emailSentAt: new Date("2025-09-10")
  },
  {
    userId: "emp3",
    surveyId: surveyId,
    consentGiven: true,
    timestamp: new Date("2025-09-17"),
    consentToken: "token789",
    emailSent: true,
    emailSentAt: new Date("2025-09-10")
  },
  {
    userId: "emp4",
    surveyId: surveyId,
    consentGiven: null, // No response yet
    timestamp: null,
    consentToken: "tokenABC",
    emailSent: true,
    emailSentAt: new Date("2025-09-10")
  }
];

// Insert consents
db.consents.insertMany(consents);

// Sample Notifications (after publish date)
const notifications = [
  // Consent request notifications
  {
    userId: "emp1",
    surveyId: surveyId,
    type: "consent_request",
    sent: true,
    sentAt: new Date("2025-09-10"),
    deliveryStatus: "delivered",
    relatedToUserId: null
  },
  {
    userId: "emp2",
    surveyId: surveyId,
    type: "consent_request",
    sent: true,
    sentAt: new Date("2025-09-10"),
    deliveryStatus: "delivered",
    relatedToUserId: null
  },
  {
    userId: "emp3",
    surveyId: surveyId,
    type: "consent_request",
    sent: true,
    sentAt: new Date("2025-09-10"),
    deliveryStatus: "delivered",
    relatedToUserId: null
  },
  {
    userId: "emp4",
    surveyId: surveyId,
    type: "consent_request",
    sent: true,
    sentAt: new Date("2025-09-10"),
    deliveryStatus: "delivered",
    relatedToUserId: null
  },
  
  // Survey available notifications (only for consenting users)
  {
    userId: "emp1",
    surveyId: surveyId,
    type: "survey_available",
    sent: true,
    sentAt: new Date("2025-10-01"),
    deliveryStatus: "delivered",
    relatedToUserId: null
  },
  {
    userId: "emp3",
    surveyId: surveyId,
    type: "survey_available",
    sent: true,
    sentAt: new Date("2025-10-01"),
    deliveryStatus: "delivered",
    relatedToUserId: null
  },
  
  // Manager notifications
  {
    userId: "admin",
    surveyId: surveyId,
    type: "manager_notification",
    sent: true,
    sentAt: new Date("2025-10-01"),
    deliveryStatus: "delivered",
    relatedToUserId: "emp1"
  },
  {
    userId: "manager",
    surveyId: surveyId,
    type: "manager_notification",
    sent: true,
    sentAt: new Date("2025-10-01"),
    deliveryStatus: "delivered",
    relatedToUserId: "emp3"
  }
];

// Insert notifications
db.notifications.insertMany(notifications);

// Sample Survey Attempts
const surveyAttempts = [
  {
    surveyId: surveyId,
    userId: "emp1", // Consented user
    startedAt: new Date("2025-10-02"),
    completedAt: new Date("2025-10-02"),
    completed: true,
    anonymous: false
  },
  {
    surveyId: surveyId,
    userId: "emp3", // Consented user
    startedAt: new Date("2025-10-03"),
    completedAt: null,
    completed: false,
    anonymous: false
  },
  {
    surveyId: surveyId,
    userId: null, // Anonymous user (no consent)
    startedAt: new Date("2025-10-04"),
    completedAt: new Date("2025-10-04"),
    completed: true,
    anonymous: true
  }
];

// Insert survey attempts
db.surveyAttempts.insertMany(surveyAttempts);

// Sample Responses
const responses = [
  // Responses from emp1 (consented)
  {
    surveyId: surveyId,
    questionId: questions[0]._id,
    userId: "emp1",
    selectedOption: "Satisfied",
    submittedAt: new Date("2025-10-02"),
    anonymous: false
  },
  {
    surveyId: surveyId,
    questionId: questions[1]._id,
    userId: "emp1",
    selectedOption: "Good",
    submittedAt: new Date("2025-10-02"),
    anonymous: false
  },
  {
    surveyId: surveyId,
    questionId: questions[2]._id,
    userId: "emp1",
    selectedOption: "Often",
    submittedAt: new Date("2025-10-02"),
    anonymous: false
  },
  
  // Anonymous responses (no consent)
  {
    surveyId: surveyId,
    questionId: questions[0]._id,
    userId: null,
    selectedOption: "Dissatisfied",
    submittedAt: new Date("2025-10-04"),
    anonymous: true
  },
  {
    surveyId: surveyId,
    questionId: questions[1]._id,
    userId: null,
    selectedOption: "Poor",
    submittedAt: new Date("2025-10-04"),
    anonymous: true
  },
  {
    surveyId: surveyId,
    questionId: questions[2]._id,
    userId: null,
    selectedOption: "Rarely",
    submittedAt: new Date("2025-10-04"),
    anonymous: true
  }
];

// Insert responses
db.responses.insertMany(responses);

// Example Queries for Reports

// 1. Survey participation rate
db.surveyAttempts.aggregate([
  { $match: { surveyId: surveyId } },
  { $group: {
      _id: "$surveyId",
      totalAttempts: { $sum: 1 },
      completedAttempts: { $sum: { $cond: ["$completed", 1, 0] } },
      identifiedUsers: { $sum: { $cond: [{ $ne: ["$userId", null] }, 1, 0] } },
      anonymousUsers: { $sum: { $cond: ["$anonymous", 1, 0] } }
    }
  }
]);

// 2. Response distribution for a specific question
db.responses.aggregate([
  { $match: { surveyId: surveyId, questionId: questions[0]._id } },
  { $group: {
      _id: "$selectedOption",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);

// 3. User-specific responses (only for users who gave consent)
db.responses.find(
  { surveyId: surveyId, userId: "emp1", anonymous: false },
  { questionId: 1, selectedOption: 1 }
);

// 4. Parameter-based analysis
db.responses.aggregate([
  { $lookup: {
      from: "questions",
      localField: "questionId",
      foreignField: "_id",
      as: "questionData"
    }
  },
  { $unwind: "$questionData" },
  { $match: { 
      surveyId: surveyId,
      "questionData.parameter": "Work Environment"
    }
  },
  { $group: {
      _id: "$selectedOption",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);

