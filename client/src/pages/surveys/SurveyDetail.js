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
      backgroundColor: theme.palette.background.default,
      position: 'relative',
    }}>
      <Container maxWidth={false} sx={{ position: 'relative', zIndex: 1, py: 2, width: '100%' }}>
        {/* Header Section */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title="Back to Surveys">
                  <IconButton 
                    onClick={() => navigate('/surveys')}
                    sx={{ 
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      '&:hover': { 
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        transform: 'translateX(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                </Tooltip>
                <Box>
                  <Typography variant="h4" component="h1" sx={{ 
                    fontWeight: 700, 
                    fontSize: '2rem',
                    color: theme.palette.text.primary,
                    letterSpacing: '-0.01em',
                    mb: 0.5
                  }}>
                    Survey Details
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem', fontWeight: 400 }}>
                    View and manage survey information
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label={surveyStatus.label} 
                color={surveyStatus.color} 
                size="medium"
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.875rem',
                  height: 32,
                  px: 2
                }}
              />
            </Box>
          </Box>
        </Fade>

        {/* Survey Information Card */}
        <Slide direction="up" in timeout={1000}>
          <Card sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: 'none',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            backgroundColor: theme.palette.background.paper,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
            }
          }}>
            <CardContent sx={{ p: 4, '&:last-child': { pb: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1), 
                  width: 56, 
                  height: 56, 
                  mr: 2,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}>
                  <Typography variant="h5" sx={{ 
                    color: theme.palette.primary.main, 
                    fontWeight: 700,
                    fontSize: '1.5rem'
                  }}>
                    {survey.name.charAt(0).toUpperCase()}
                  </Typography>
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700, 
                    mb: 0.5, 
                    fontSize: '1.5rem',
                    color: theme.palette.text.primary
                  }}>
                    {survey.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Survey ID: {survey._id.slice(-8)}
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      transform: 'translateY(-2px)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        width: 40, 
                        height: 40, 
                        mr: 2,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }}>
                        <CalendarTodayIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          Publish Date
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: theme.palette.primary.main }}>
                          {new Date(survey.publishDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: 'Asia/Kolkata'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.warning.main, 0.02),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.warning.main, 0.04),
                      transform: 'translateY(-2px)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.warning.main, 0.1), 
                        width: 40, 
                        height: 40, 
                        mr: 2,
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                      }}>
                        <AccessTimeIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          Duration
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: theme.palette.warning.main }}>
                          {survey.durationDays} days
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.success.main, 0.02),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.success.main, 0.04),
                      transform: 'translateY(-2px)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.success.main, 0.1), 
                        width: 40, 
                        height: 40, 
                        mr: 2,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}>
                        <BusinessIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          Department
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: theme.palette.success.main }}>
                          {survey.department || 'All'}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.info.main, 0.02),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.info.main, 0.04),
                      transform: 'translateY(-2px)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.info.main, 0.1), 
                        width: 40, 
                        height: 40, 
                        mr: 2,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                      }}>
                        <PeopleIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          Target Employees
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: theme.palette.info.main }}>
                          {survey.targetEmployees?.length || 0} employees
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Slide>

        {/* Action Buttons */}
        <Slide direction="up" in timeout={1200}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: 'none',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            backgroundColor: theme.palette.background.paper,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
            }
          }}>
            <CardContent sx={{ p: 4, '&:last-child': { pb: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                  width: 48, 
                  height: 48, 
                  mr: 2,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                }}>
                  <AssessmentIcon sx={{ fontSize: 24, color: theme.palette.secondary.main }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ 
                    mb: 0.5, 
                    fontWeight: 700, 
                    fontSize: '1.25rem',
                    color: theme.palette.text.primary
                  }}>
                    Survey Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', fontWeight: 400 }}>
                    Manage and control your survey
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {isAdmin && (
                  <>
                    {/* Edit Survey button - enabled only for upcoming surveys */}
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                      onClick={handleEditSurvey}
                      disabled={survey.currentStatus !== 'upcoming'}
                      sx={{
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        fontSize: '0.875rem',
                        py: 1,
                        px: 2,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          transform: 'translateY(-1px)',
                        },
                        '&.Mui-disabled': {
                          borderColor: alpha(theme.palette.text.disabled, 0.3),
                          color: theme.palette.text.disabled,
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      Edit Survey
                    </Button>

                    {/* Manage Questions button - enabled only for upcoming surveys */}
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<QuizIcon sx={{ fontSize: 18 }} />}
                      onClick={handleManageQuestions}
                      disabled={survey.currentStatus !== 'upcoming'}
                      sx={{
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        fontSize: '0.875rem',
                        py: 1,
                        px: 2,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          transform: 'translateY(-1px)',
                        },
                        '&.Mui-disabled': {
                          borderColor: alpha(theme.palette.text.disabled, 0.3),
                          color: theme.palette.text.disabled,
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      Manage Questions
                    </Button>

                    {/* Manage Consent button - enabled for upcoming and active surveys */}
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<AssignmentIcon sx={{ fontSize: 18 }} />}
                      onClick={handleManageConsent}
                      disabled={survey.currentStatus === 'closed'}
                      sx={{
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        fontSize: '0.875rem',
                        py: 1,
                        px: 2,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          transform: 'translateY(-1px)',
                        },
                        '&.Mui-disabled': {
                          borderColor: alpha(theme.palette.text.disabled, 0.3),
                          color: theme.palette.text.disabled,
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      Manage Consent
                    </Button>

                    {/* View Report button - always enabled */}
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={<AssessmentIcon sx={{ fontSize: 18 }} />}
                      onClick={handleViewReport}
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        fontSize: '0.875rem',
                        py: 1,
                        px: 2,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease-in-out'
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
