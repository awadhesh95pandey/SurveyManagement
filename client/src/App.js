import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layout
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Survey Pages
import Dashboard from './pages/dashboard/Dashboard';
import SurveyList from './pages/surveys/SurveyList';
import SurveyCreate from './pages/surveys/SurveyCreate';
import SurveyEdit from './pages/surveys/SurveyEdit';
import SurveyDetail from './pages/surveys/SurveyDetail';
import TakeSurvey from './pages/survey/TakeSurvey';

// Question Pages
import QuestionList from './pages/questions/QuestionList';
import QuestionUpload from './pages/questions/QuestionUpload';

// Consent Pages
import ConsentForm from './pages/consent/ConsentForm';
import ConsentStatus from './pages/consent/ConsentStatus';

// Response Pages
import SurveyAttempt from './pages/responses/SurveyAttempt';
import SurveyComplete from './pages/responses/SurveyComplete';
import AnonymousSurveyAttempt from './pages/responses/AnonymousSurveyAttempt';

// Report Pages
import SurveyReport from './pages/reports/SurveyReport';
import UserReport from './pages/reports/UserReport';
import ReportsIndex from './pages/reports/ReportsIndex';

// Notification Pages
import NotificationList from './pages/notifications/NotificationList';

// Profile Pages
import Profile from './pages/profile/Profile';

// Auth Context and Protected Route
import { useAuth } from './contexts/AuthContext';
import NotFound from './pages/NotFound';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/consent/:token" element={<ConsentForm />} />
        
        {/* Public Survey Routes - No authentication required */}
        <Route path="/surveys/:id/take" element={<TakeSurvey />} />
        <Route path="/survey/:token" element={<AnonymousSurveyAttempt />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Survey Routes */}
          <Route path="surveys" element={<SurveyList />} />
          <Route
            path="surveys/create"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SurveyCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="surveys/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SurveyEdit />
              </ProtectedRoute>
            }
          />
          <Route path="surveys/:id" element={<SurveyDetail />} />

          {/* Question Routes */}
          <Route
            path="surveys/:surveyId/questions"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <QuestionList />
              </ProtectedRoute>
            }
          />
          <Route
            path="surveys/:surveyId/questions/upload"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <QuestionUpload />
              </ProtectedRoute>
            }
          />

          {/* Consent Routes */}
          <Route
            path="surveys/:surveyId/consent"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ConsentStatus />
              </ProtectedRoute>
            }
          />

          {/* Response Routes */}
          <Route path="surveys/:surveyId/attempt" element={<SurveyAttempt />} />
          <Route path="surveys/:surveyId/complete" element={<SurveyComplete />} />

          {/* Report Routes */}
          <Route path="reports" element={<ReportsIndex />} />
          <Route
            path="reports/surveys/:surveyId"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SurveyReport />
              </ProtectedRoute>
            }
          />
          <Route path="reports/users/:userId/surveys/:surveyId" element={<UserReport />} />

          {/* Notification Routes */}
          <Route path="notifications" element={<NotificationList />} />

          {/* Profile Routes */}
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
