// MongoDB Schema for Survey Management System

// Survey Collection
db.createCollection("surveys", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "publishDate", "durationDays", "createdAt", "status"],
      properties: {
        name: {
          bsonType: "string",
          description: "Title of the survey"
        },
        publishDate: {
          bsonType: "date",
          description: "Date when the survey becomes available"
        },
        durationDays: {
          bsonType: "int",
          minimum: 1,
          description: "Duration (in days) survey remains open"
        },
        endDate: {
          bsonType: "date",
          description: "Calculated end date based on publishDate and durationDays"
        },
        department: {
          bsonType: ["string", "null"],
          description: "Target department for the survey (null if targeting all departments)"
        },
        targetEmployees: {
          bsonType: ["array", "null"],
          description: "Array of employee IDs if targeting specific users",
          items: {
            bsonType: "string"
          }
        },
        createdBy: {
          bsonType: "string",
          description: "ID of the admin who created the survey"
        },
        createdAt: {
          bsonType: "date",
          description: "Timestamp when the survey was created"
        },
        updatedAt: {
          bsonType: "date",
          description: "Timestamp when the survey was last updated"
        },
        status: {
          enum: ["draft", "pending_consent", "active", "completed", "archived"],
          description: "Current status of the survey"
        },
        consentDeadline: {
          bsonType: "date",
          description: "Deadline for providing consent (same as publishDate)"
        }
      }
    }
  }
});

// Questions Collection
db.createCollection("questions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["surveyId", "questionText", "options"],
      properties: {
        surveyId: {
          bsonType: "objectId",
          description: "Reference to the survey this question belongs to"
        },
        questionText: {
          bsonType: "string",
          description: "The text of the question"
        },
        options: {
          bsonType: "array",
          minItems: 2,
          maxItems: 4,
          description: "Array of options for the question (min 2, max 4)",
          items: {
            bsonType: "string"
          }
        },
        parameter: {
          bsonType: ["string", "null"],
          description: "Optional parameter for categorization"
        },
        order: {
          bsonType: "int",
          description: "Order of the question in the survey"
        }
      }
    }
  }
});

// Consent Collection
db.createCollection("consents", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "surveyId", "consentGiven", "timestamp"],
      properties: {
        userId: {
          bsonType: "string",
          description: "ID of the user"
        },
        surveyId: {
          bsonType: "objectId",
          description: "Reference to the survey"
        },
        consentGiven: {
          bsonType: "bool",
          description: "Whether consent was given"
        },
        timestamp: {
          bsonType: "date",
          description: "When consent was given or denied"
        },
        consentToken: {
          bsonType: "string",
          description: "Unique token for consent verification link"
        },
        emailSent: {
          bsonType: "bool",
          description: "Whether consent email was sent to the user"
        },
        emailSentAt: {
          bsonType: "date",
          description: "When consent email was sent"
        }
      }
    }
  }
});

// Responses Collection
db.createCollection("responses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["surveyId", "questionId", "selectedOption", "submittedAt"],
      properties: {
        surveyId: {
          bsonType: "objectId",
          description: "Reference to the survey"
        },
        questionId: {
          bsonType: "objectId",
          description: "Reference to the question"
        },
        userId: {
          bsonType: ["string", "null"],
          description: "ID of the user (null if anonymous/no consent)"
        },
        selectedOption: {
          bsonType: "string",
          description: "The selected option"
        },
        submittedAt: {
          bsonType: "date",
          description: "When the response was submitted"
        },
        anonymous: {
          bsonType: "bool",
          description: "Whether this response is anonymous (no user consent)"
        }
      }
    }
  }
});

// Notifications Collection
db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "surveyId", "type", "sent", "sentAt"],
      properties: {
        userId: {
          bsonType: "string",
          description: "ID of the user to notify"
        },
        surveyId: {
          bsonType: "objectId",
          description: "Reference to the survey"
        },
        type: {
          enum: ["consent_request", "survey_available", "manager_notification", "reportee_notification"],
          description: "Type of notification"
        },
        sent: {
          bsonType: "bool",
          description: "Whether notification was sent"
        },
        sentAt: {
          bsonType: "date",
          description: "When notification was sent"
        },
        deliveryStatus: {
          enum: ["pending", "sent", "failed", "delivered", "opened"],
          description: "Status of the notification delivery"
        },
        relatedToUserId: {
          bsonType: ["string", "null"],
          description: "For manager/reportee notifications, the ID of the related user"
        }
      }
    }
  }
});

// Users Collection (for reference)
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "name", "role"],
      properties: {
        email: {
          bsonType: "string",
          description: "User's email address"
        },
        name: {
          bsonType: "string",
          description: "User's full name"
        },
        department: {
          bsonType: "string",
          description: "User's department"
        },
        role: {
          enum: ["admin", "employee", "manager"],
          description: "User's role in the system"
        },
        managerId: {
          bsonType: ["string", "null"],
          description: "ID of the user's manager (null if no manager)"
        },
        directReports: {
          bsonType: "array",
          description: "Array of user IDs who report to this user",
          items: {
            bsonType: "string"
          }
        }
      }
    }
  }
});

// Survey Attempts Collection (to track who has taken the survey)
db.createCollection("surveyAttempts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["surveyId", "startedAt"],
      properties: {
        surveyId: {
          bsonType: "objectId",
          description: "Reference to the survey"
        },
        userId: {
          bsonType: ["string", "null"],
          description: "ID of the user (null if anonymous)"
        },
        startedAt: {
          bsonType: "date",
          description: "When the survey was started"
        },
        completedAt: {
          bsonType: ["date", "null"],
          description: "When the survey was completed (null if not completed)"
        },
        completed: {
          bsonType: "bool",
          description: "Whether the survey was completed"
        },
        anonymous: {
          bsonType: "bool",
          description: "Whether this attempt is anonymous"
        }
      }
    }
  }
});

// Create indexes for better performance
db.surveys.createIndex({ "publishDate": 1 });
db.surveys.createIndex({ "status": 1 });
db.surveys.createIndex({ "department": 1 });

db.questions.createIndex({ "surveyId": 1 });
db.questions.createIndex({ "surveyId": 1, "order": 1 });

db.consents.createIndex({ "userId": 1, "surveyId": 1 }, { unique: true });
db.consents.createIndex({ "consentToken": 1 }, { unique: true });
db.consents.createIndex({ "surveyId": 1, "consentGiven": 1 });

db.responses.createIndex({ "surveyId": 1 });
db.responses.createIndex({ "surveyId": 1, "questionId": 1 });
db.responses.createIndex({ "surveyId": 1, "userId": 1 });

db.notifications.createIndex({ "userId": 1, "surveyId": 1, "type": 1 });
db.notifications.createIndex({ "surveyId": 1, "type": 1 });

db.surveyAttempts.createIndex({ "surveyId": 1 });
db.surveyAttempts.createIndex({ "userId": 1, "surveyId": 1 });
db.surveyAttempts.createIndex({ "surveyId": 1, "completed": 1 });

