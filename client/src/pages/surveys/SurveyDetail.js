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
  Alert,
  Card,
  CardContent,
  alpha,
  useTheme,
  Fade,
  Slide,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SurveyDetail = () => {
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
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
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.01)} 0%, ${alpha('#ffffff', 0.95)} 50%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (!survey) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.01)} 0%, ${alpha('#ffffff', 0.95)} 50%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          Survey not found
        </Alert>
      </Box>
    );
  }

  const surveyStatus = getSurveyStatus();
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.01)} 0%, ${alpha('#ffffff', 0.95)} 50%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.005'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.3,
      }
    }}>
      <Container maxWidth={false} sx={{ position: 'relative', zIndex: 1, py: 2, width: '100%' }}>
        {/* Header Section */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Tooltip title="Back to Surveys">
                  <IconButton 
                    onClick={() => navigate('/surveys')}
                    sx={{ 
                      color: theme.palette.primary.main,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
                  Survey Details
                </Typography>
              </Box>
              <Chip 
                label={surveyStatus.label} 
                color={surveyStatus.color} 
                size="small"
                sx={{ fontWeight: 500, fontSize: '0.75rem' }}
              />
            </Box>
          </Box>
        </Fade>

        {/* Survey Information Card */}
        <Slide direction="up" in timeout={1000}>
          <Card sx={{ 
            mb: 2, 
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, fontSize: '1.1rem' }}>
                {survey.name}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      width: 28, 
                      height: 28, 
                      mr: 1 
                    }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Publish Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {new Date(survey.publishDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          timeZone: 'Asia/Kolkata'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                      width: 28, 
                      height: 28, 
                      mr: 1 
                    }}>
                      <AccessTimeIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Duration
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {survey.durationDays} days
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1), 
                      width: 28, 
                      height: 28, 
                      mr: 1 
                    }}>
                      <BusinessIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Department
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {survey.department || 'All'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1), 
                      width: 28, 
                      height: 28, 
                      mr: 1 
                    }}>
                      <PeopleIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Target Employees
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {survey.targetEmployees?.length || 0} employees
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Slide>

        {/* Action Buttons */}
        <Slide direction="up" in timeout={1200}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.9rem' }}>
                Actions
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {surveyStatus.status === 'active' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
                    onClick={handleTakeSurvey}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      fontSize: '0.75rem',
                      py: 0.75,
                      px: 1.5,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      }
                    }}
                  >
                    Take Survey
                  </Button>
                )}

                {isAdmin && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                      onClick={handleEditSurvey}
                      sx={{
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        fontSize: '0.75rem',
                        py: 0.75,
                        px: 1.5,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        }
                      }}
                    >
                      Edit Survey
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<QuizIcon sx={{ fontSize: 16 }} />}
                      onClick={handleManageQuestions}
                      sx={{
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        fontSize: '0.75rem',
                        py: 0.75,
                        px: 1.5,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        }
                      }}
                    >
                      Manage Questions
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AssignmentIcon sx={{ fontSize: 16 }} />}
                      onClick={handleManageConsent}
                      sx={{
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        fontSize: '0.75rem',
                        py: 0.75,
                        px: 1.5,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        }
                      }}
                    >
                      Manage Consent
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AssessmentIcon sx={{ fontSize: 16 }} />}
                      onClick={handleViewReport}
                      sx={{
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        fontSize: '0.75rem',
                        py: 0.75,
                        px: 1.5,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        }
                      }}
                    >
                      View Report
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Slide>
      </Container>
    </Box>
  );
};

export default SurveyDetail;

