# Data Relationships in Survey Management System

This document explains the relationships between collections in the MongoDB schema for the Survey Management System.

## Collection Relationships

```
                                  ┌─────────────┐
                                  │   Surveys   │
                                  └──────┬──────┘
                                         │
                 ┌────────────────┬──────┴──────┬────────────────┐
                 │                │             │                │
        ┌────────▼─────┐  ┌──────▼──────┐  ┌───▼────────┐  ┌────▼─────────┐
        │   Questions  │  │   Consents  │  │Notifications│  │SurveyAttempts│
        └────────┬─────┘  └──────┬──────┘  └────────────┘  └────┬─────────┘
                 │                │                              │
                 │                │                              │
        ┌────────▼────────────────┴──────────────────────┐      │
        │                                                 │      │
        │                  Responses                      ◄──────┘
        │                                                 │
        └─────────────────────────────────────────────────┘
```

## Key Relationships

### 1. Surveys → Questions
- One-to-many relationship
- A survey contains multiple questions
- Questions reference their parent survey via `surveyId`

### 2. Surveys → Consents
- One-to-many relationship
- A survey has multiple consent records (one per user)
- Consent records reference their survey via `surveyId`

### 3. Surveys → Notifications
- One-to-many relationship
- A survey has multiple notification records
- Notifications reference their survey via `surveyId`

### 4. Surveys → Survey Attempts
- One-to-many relationship
- A survey has multiple attempt records
- Attempts reference their survey via `surveyId`

### 5. Questions → Responses
- One-to-many relationship
- A question can have multiple responses (from different users)
- Responses reference their question via `questionId`

### 6. Survey Attempts → Responses
- One-to-many relationship (implicit)
- A survey attempt consists of multiple responses
- Responses are linked to attempts through shared `surveyId` and `userId`

### 7. Consents → Responses
- Indirect relationship
- Consent status determines whether responses store user ID
- For users with consent, responses include `userId`
- For users without consent, responses are anonymous (`userId` is null)

## Data Flow in the System

1. **Survey Creation Flow**:
   ```
   Create Survey → Upload Questions → Generate Consent Records → Send Consent Notifications
   ```

2. **Consent Flow**:
   ```
   User Receives Consent Email → User Gives/Denies Consent → System Records Consent Status
   ```

3. **Survey Publication Flow**:
   ```
   Survey Publish Date Arrives → System Updates Survey Status → 
   System Sends Notifications to Consenting Users, Their Managers, and Reportees
   ```

4. **Survey Participation Flow**:
   ```
   User Starts Survey → System Creates Survey Attempt → 
   User Submits Responses → System Records Responses (with or without user ID based on consent) →
   System Marks Attempt as Completed
   ```

5. **Reporting Flow**:
   ```
   Admin Requests Report → System Aggregates Responses → 
   System Filters User-Specific Data Based on Consent → System Generates Report
   ```

## Important Constraints

1. **Consent and Anonymity**:
   - User IDs are only stored with responses if consent was given
   - Without consent, responses are stored anonymously
   - This constraint is enforced at the application level

2. **Consent Deadline**:
   - Consent can only be given before the survey's publish date
   - After publish date, consent links expire
   - This constraint is enforced at the application level

3. **Survey Status Transitions**:
   ```
   draft → pending_consent → active → completed → archived
   ```

4. **Question Options**:
   - Minimum 2 options per question
   - Maximum 4 options per question
   - This constraint is enforced in the schema validation

## Query Patterns

The schema is optimized for the following common query patterns:

1. **Finding active surveys for a user**:
   - Efficient with indexes on `surveys` collection by status and department

2. **Checking if a user has given consent**:
   - Efficient with compound index on `consents` collection by userId and surveyId

3. **Retrieving all questions for a survey**:
   - Efficient with index on `questions` collection by surveyId

4. **Generating survey reports**:
   - Aggregation pipelines on `responses` collection
   - Joins with `questions` collection for question text and parameters

5. **Tracking survey participation**:
   - Queries on `surveyAttempts` collection
   - Efficient with indexes on surveyId and userId

