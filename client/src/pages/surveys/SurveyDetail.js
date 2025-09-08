import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';

const SurveyDetail = () => {
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    debugger;
    setLoading(true);
    try {
      const result = await surveyApi.getSurvey(id);
      if (result.success) {
        setSurvey(result.data);
      } else {
        toast.error('Failed to fetch survey details');
        navigate('/surveys');
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
      toast.error('An error occurred while fetching survey details');
      navigate('/surveys');
    } finally {
      setLoading(false);
    }
  };

  const getSurveyStatus = () => {
    if (!survey) return null;
    
    const now = new Date();
    const publishDate = new Date(survey.publishDate);
    const endDate = new Date(publishDate);
    endDate.setDate(endDate.getDate() + survey.durationDays);

    if (now < publishDate) {
      return { status: 'upcoming', label: 'Upcoming', color: 'info' };
    } else if (now >= publishDate && now <= endDate) {
      return { status: 'active', label: 'Active', color: 'success' };
    } else {
      return { status: 'closed', label: 'Closed', color: 'default' };
    }
  };

  const handleTakeSurvey = () => {
    navigate(`/surveys/${id}/attempt`);
  };

  const handleEditSurvey = () => {
    navigate(`/surveys/edit/${id}`);
  };

  const handleManageQuestions = () => {
    navigate(`/surveys/${id}/questions`);
  };

  const handleManageConsent = () => {
    navigate(`/surveys/${id}/consent`);
  };

  const handleViewReport = () => {
    navigate(`/reports/surveys/${id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!survey) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">Survey not found</Alert>
        </Box>
      </Container>
    );
  }

  const surveyStatus = getSurveyStatus();
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Survey Details
          </Typography>
          <Chip 
            label={surveyStatus.label} 
            color={surveyStatus.color} 
            size="medium"
          />
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {survey.name}
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Publish Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(survey.publishDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {survey.durationDays} days
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Target Department
                  </Typography>
                  <Typography variant="body1">
                    {survey.department || 'All Departments'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Target Employees
                  </Typography>
                  <Typography variant="body1">
                    {survey.targetEmployees?.length || 0} employees
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {surveyStatus.status === 'active' && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleTakeSurvey}
              >
                Take Survey
              </Button>
            )}

            {isAdmin && (
              <>
                <Button
                  variant="outlined"
                  onClick={handleEditSurvey}
                >
                  Edit Survey
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleManageQuestions}
                >
                  Manage Questions
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleManageConsent}
                >
                  Manage Consent
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleViewReport}
                >
                  View Report
                </Button>
              </>
            )}
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button variant="outlined" onClick={() => navigate('/surveys')}>
            Back to Surveys
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default SurveyDetail;

