# Survey Management System API

This is a Node.js API for the Survey Management System that allows administrators to create surveys, collect user consent, and generate reports while maintaining user anonymity when required.

## Features

- User authentication and authorization
- Survey creation and management
- Question upload from Excel/CSV files
- Consent workflow with email notifications
- Anonymous survey responses for non-consenting users
- Reporting with user-specific and survey-wide reports
- Email notifications to users, managers, and reportees

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer for email sending
- Multer for file uploads
- CSV and Excel parsing

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the server:
   ```
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout

### Surveys

- `GET /api/surveys` - Get all surveys
- `POST /api/surveys` - Create a new survey
- `GET /api/surveys/upcoming` - Get upcoming surveys
- `GET /api/surveys/active` - Get active surveys
- `GET /api/surveys/:id` - Get a specific survey
- `PUT /api/surveys/:id` - Update a survey
- `DELETE /api/surveys/:id` - Delete a survey
- `PUT /api/surveys/:id/status` - Update survey status
- `POST /api/surveys/:id/generate-consent` - Generate consent records
- `GET /api/surveys/update-statuses` - Update survey statuses based on dates

### Questions

- `GET /api/surveys/:surveyId/questions` - Get all questions for a survey
- `POST /api/surveys/:surveyId/questions` - Create a new question
- `POST /api/surveys/:surveyId/questions/upload` - Upload questions from file
- `GET /api/questions/sample-template` - Download sample question template
- `GET /api/questions/:id` - Get a specific question
- `PUT /api/questions/:id` - Update a question
- `DELETE /api/questions/:id` - Delete a question

### Consent

- `POST /api/consent/:token` - Record user consent
- `GET /api/consent/:token/verify` - Verify consent token
- `GET /api/surveys/:surveyId/consent` - Get consent status for a survey
- `GET /api/surveys/:surveyId/consent/check` - Check if user has given consent

### Responses

- `POST /api/surveys/:surveyId/attempt` - Start a survey attempt
- `POST /api/surveys/:surveyId/responses` - Submit a response
- `PUT /api/surveys/:surveyId/attempt/:attemptId/complete` - Complete a survey attempt
- `GET /api/surveys/:surveyId/responses` - Get all responses for a survey
- `GET /api/surveys/:surveyId/responses/user/:userId` - Get responses for a specific user
- `GET /api/surveys/:surveyId/responses/participation` - Get survey participation statistics

### Reports

- `GET /api/reports/surveys/:surveyId` - Generate survey report
- `GET /api/reports/users/:userId/surveys/:surveyId` - Generate user report
- `GET /api/reports/surveys/:surveyId/export` - Export survey results

### Notifications

- `POST /api/surveys/:surveyId/notifications/send` - Send notifications for active survey
- `GET /api/surveys/:surveyId/notifications` - Get notifications for a survey
- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## Data Flow

1. **Survey Creation**:
   - Admin creates a survey
   - Admin uploads questions
   - System generates consent records
   - System sends consent emails

2. **Consent Process**:
   - Users receive consent emails
   - Users provide or deny consent
   - System records consent status

3. **Survey Publication**:
   - On publish date, survey becomes active
   - System sends notifications to consenting users, their managers, and reportees

4. **Survey Participation**:
   - Users start survey attempts
   - Users submit responses
   - System stores responses (with or without user ID based on consent)

5. **Reporting**:
   - Admin generates survey-wide reports
   - Admin or users generate user-specific reports (only for consenting users)

## Authentication and Authorization

The API uses JWT (JSON Web Token) for authentication. Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Role-based authorization is implemented with three roles:
- `admin`: Can create and manage surveys, questions, and view all reports
- `manager`: Can view surveys and participate
- `employee`: Can view and participate in surveys

## Environment Variables

The following environment variables are required:

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development, production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT signing
- `JWT_EXPIRE`: JWT expiration time
- `EMAIL_SERVICE`: Email service (e.g., gmail)
- `EMAIL_USERNAME`: Email username
- `EMAIL_PASSWORD`: Email password
- `EMAIL_FROM`: From email address
- `FRONTEND_URL`: Frontend URL for email links

