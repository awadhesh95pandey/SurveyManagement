import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { consentApi } from '../../services/api';
import { toast } from 'react-toastify';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const ConsentForm = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consentData, setConsentData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [consent, setConsent] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    debugger
    setLoading(true);
    try {
      const result = await consentApi.verifyConsentToken(token);
      if (result.success) {
        setConsentData(result.data);
        setError(null);
      } else {
        setError(result.message || 'Invalid or expired consent token');
        setConsentData(null);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setError('An error occurred while verifying the consent token');
      setConsentData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = (event) => {
    setConsent(event.target.checked);
  };

  const handleSubmit = async () => {
    debugger
    setSubmitting(true);
    try {
      const result = await consentApi.recordConsent(token, consent);
      if (result.success) {
        setSuccess(true);
        toast.success('Your consent has been recorded successfully');
      } else {
        toast.error(result.message || 'Failed to record consent');
      }
    } catch (error) {
      console.error('Error recording consent:', error);
      toast.error('An error occurred while recording your consent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Verifying consent token...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <Paper sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              Invalid Consent Link
            </Typography>
            <Typography variant="body1" paragraph>
              {error}
            </Typography>
            <Button variant="contained" color="primary" onClick={handleGoToLogin}>
              Go to Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <Paper sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" component="h1" gutterBottom>
              Consent Recorded
            </Typography>
            <Typography variant="body1" paragraph>
              Your consent has been successfully recorded for the survey:
            </Typography>
            <Typography variant="h6" gutterBottom>
              {consentData?.survey?.name}
            </Typography>
            <Typography variant="body1" paragraph>
              {consent
                ? 'You will receive a notification when the survey becomes available.'
                : 'You have chosen not to participate in this survey. Your response has been recorded.'}
            </Typography>
            <Button variant="contained" color="primary" onClick={handleGoToLogin}>
              Go to Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Survey Consent Form
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Survey: {consentData?.survey?.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Publish Date: {new Date(consentData?.survey?.publishDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Valid Till: {new Date(consentData?.survey?.consentDeadline).toLocaleDateString()}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Important Information</AlertTitle>
            <Typography variant="body2" paragraph>
              You are invited to participate in this survey. Before you decide to participate, please read the following information carefully.
            </Typography>
          </Alert>

          <Typography variant="h6" gutterBottom>
            Survey Purpose
          </Typography>
          <Typography variant="body1" paragraph>
            This survey aims to collect feedback from employees to improve our workplace environment and processes.
          </Typography>

          <Typography variant="h6" gutterBottom>
            Participation and Anonymity
          </Typography>
          <Typography variant="body1" paragraph>
            Your participation in this survey is voluntary. You can choose to participate with your identity known (by giving consent below) or anonymously.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>If you give consent:</strong> Your responses will be linked to your user account, allowing for personalized reports and follow-ups.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>If you do not give consent:</strong> You can still participate in the survey, but your responses will be recorded anonymously without any link to your user account.
          </Typography>

          <Typography variant="h6" gutterBottom>
            Data Usage
          </Typography>
          <Typography variant="body1" paragraph>
            The data collected will be used for internal analysis and improvement purposes. If you give consent, your responses may be shared with your reporting managers.
          </Typography>

          <Box sx={{ mt: 4, mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consent}
                  onChange={handleConsentChange}
                  name="consent"
                  color="primary"
                />
              }
              label="I consent to participate in this survey with my identity known. I understand that my responses will be linked to my user account."
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
              size="large"
            >
              {submitting ? <CircularProgress size={24} /> : 'Submit Consent Decision'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ConsentForm;

