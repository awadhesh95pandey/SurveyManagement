import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  CircularProgress,
  Chip,
  Avatar,
  Fade,
  Slide,
  alpha,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { surveyApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [activeSurveys, setActiveSurveys] = useState([]);
  const [upcomingSurveys, setUpcomingSurveys] = useState([]);
  const [completedSurveys, setCompletedSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    debugger;
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        // Fetch active surveys
        const activeResult = await surveyApi.getActiveSurveys();
        if (activeResult.success) {
          setActiveSurveys(activeResult.data);
        } else {
          toast.error('Failed to fetch active surveys');
        }

        // Fetch upcoming surveys
        const upcomingResult = await surveyApi.getUpcomingSurveys();
        if (upcomingResult.success) {
          setUpcomingSurveys(upcomingResult.data);
        } else {
          toast.error('Failed to fetch upcoming surveys');
        }

        // Fetch completed surveys
        const completedResult = await surveyApi.getCompletedSurveys();
        if (completedResult.success) {
          setCompletedSurveys(completedResult.data);
        } else {
          toast.error('Failed to fetch completed surveys');
        }
      } catch (error) {
        console.error('Error fetching surveys:', error);
        toast.error('An error occurred while fetching surveys');
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  const handleViewSurvey = (id) => {
    navigate(`/surveys/${id}`);
  };

  const handleAttemptSurvey = (id) => {
    navigate(`/surveys/${id}/attempt`);
  };

  const handleCreateSurvey = () => {
    navigate('/surveys/create');
  };

  const handleViewAllSurveys = () => {
    navigate('/surveys');
  };

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
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ py: 4 }}>
          {/* Header Section */}
          <Fade in timeout={800}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 0.5,
                      fontSize: '1.75rem'
                    }}
                  >
                    Welcome back, {user?.name || 'User'}!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                    Here's what's happening with your surveys today
                  </Typography>
                </Box>
                {isAdmin && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleCreateSurvey}
                    sx={{
                      display: 'none', // Hide Create Survey button for now
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                      transition: 'all 0.2s ease-in-out',
                      fontSize: '0.875rem',
                      px: 2,
                      py: 1
                    }}
                  >
                    Create Survey
                  </Button>
                )}
              </Box>
            </Box>
          </Fade>
          
          {/* Stats Section */}
          <Slide direction="up" in timeout={1000}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.12)})`,
                    color: theme.palette.text.primary,
                    borderRadius: 2,
                    boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.25, fontSize: '1.25rem' }}>
                          {loading ? <CircularProgress size={20} color="inherit" /> : activeSurveys.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>Active Surveys</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 32, height: 32 }}>
                        <AssignmentIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.12)})`,
                    color: theme.palette.text.primary,
                    borderRadius: 2,
                    boxShadow: `0 2px 12px ${alpha(theme.palette.secondary.main, 0.1)}`,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.15)}`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.25, fontSize: '1.25rem' }}>
                          {loading ? <CircularProgress size={20} color="inherit" /> : upcomingSurveys.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>Upcoming Surveys</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), width: 32, height: 32 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: theme.palette.secondary.main }} />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, ${alpha(theme.palette.success.main, 0.12)})`,
                    color: theme.palette.text.primary,
                    borderRadius: 2,
                    boxShadow: `0 2px 12px ${alpha(theme.palette.success.main, 0.1)}`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.15)}`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.25, fontSize: '1.25rem' }}>
                          {loading ? <CircularProgress size={20} color="inherit" /> : completedSurveys.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>Completed Surveys</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), width: 32, height: 32 }}>
                        <AssignmentTurnedInIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Slide>

          {/* Active Surveys Section */}
          <Slide direction="up" in timeout={1200}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                  Active Surveys
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={handleViewAllSurveys}
                  sx={{
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    color: theme.palette.primary.main,
                    fontSize: '0.8rem',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    }
                  }}
                >
                  View All
                </Button>
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : activeSurveys.length > 0 ? (
                <Grid container spacing={3}>
                  {activeSurveys.map((survey, index) => (
                    <Grid item xs={12} sm={6} lg={4} key={survey._id}>
                      <Fade in timeout={1400 + index * 200}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 3,
                            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                            }
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1, p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600, flexGrow: 1, mr: 1, fontSize: '0.9rem' }}>
                                {survey.name}
                              </Typography>
                              <Chip 
                                label="Active" 
                                size="small" 
                                sx={{ 
                                  bgcolor: theme.palette.success.light, 
                                  color: 'white',
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  height: 20
                                }} 
                              />
                            </Box>
                            
                            <Box sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <PeopleIcon sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  Department: {survey.department || 'All'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <ScheduleIcon sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  Started: {survey.publishDate 
                                    ? new Date(survey.publishDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        timeZone: 'Asia/Kolkata'
                                      }) 
                                    : 'N/A'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TrendingUpIcon sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  Closes in: {
                                    (() => {
                                      const publishDate = new Date(survey.publishDate);
                                      const endDate = new Date(publishDate);
                                      endDate.setDate(endDate.getDate() + survey.durationDays);

                                      const now = new Date();
                                      const diffTime = endDate - now;
                                      const remainingDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);

                                      return `${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
                                    })()
                                  }
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                          <Divider />
                          <CardActions sx={{ p: 1.5 }}>
                            <Tooltip title="View Survey">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewSurvey(survey._id)}
                                sx={{ 
                                  color: theme.palette.primary.main,
                                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                                  width: 28,
                                  height: 28
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleViewSurvey(survey._id)}
                              sx={{
                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                color: theme.palette.primary.main,
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                }
                              }}
                            >
                              View Survey
                            </Button>
                          </CardActions>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Card sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                  <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.9rem' }}>
                    No Active Surveys
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    There are currently no active surveys available.
                  </Typography>
                </Card>
              )}
            </Box>
          </Slide>

          {/* Upcoming Surveys Section */}
          <Slide direction="up" in timeout={1400}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600, fontSize: '1.25rem' }}>
                Upcoming Surveys
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : upcomingSurveys.length > 0 ? (
                <Grid container spacing={3}>
                  {upcomingSurveys.map((survey, index) => (
                    <Grid item xs={12} sm={6} lg={4} key={survey._id}>
                      <Fade in timeout={1600 + index * 200}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 3,
                            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                            }
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1, p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600, flexGrow: 1, mr: 1, fontSize: '0.9rem' }}>
                                {survey.name}
                              </Typography>
                              <Chip 
                                label="Upcoming" 
                                size="small" 
                                sx={{ 
                                  bgcolor: theme.palette.warning.light, 
                                  color: 'white',
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  height: 20
                                }} 
                              />
                            </Box>
                            
                            <Box sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <PeopleIcon sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  Department: {survey.department || 'All'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ScheduleIcon sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  Starts: {new Date(survey.publishDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    timeZone: 'Asia/Kolkata'
                                  })}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                          <Divider />
                          <CardActions sx={{ p: 1.5 }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewSurvey(survey._id)}
                                sx={{ 
                                  color: theme.palette.primary.main,
                                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                                  width: 28,
                                  height: 28
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleViewSurvey(survey._id)}
                              sx={{
                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                color: theme.palette.primary.main,
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </CardActions>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Card sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                  <PendingActionsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.9rem' }}>
                    No Upcoming Surveys
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    There are currently no upcoming surveys scheduled.
                  </Typography>
                </Card>
              )}
            </Box>
          </Slide>

          {/* Completed Surveys Section */}
          <Slide direction="up" in timeout={1600}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600, fontSize: '1.25rem' }}>
                Completed Surveys
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : completedSurveys.length > 0 ? (
                <Grid container spacing={3}>
                  {completedSurveys.map((survey, index) => (
                    <Grid item xs={12} sm={6} lg={4} key={survey._id}>
                      <Fade in timeout={1800 + index * 200}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 3,
                            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                            }
                          }}
                        >
                          <CardContent sx={{ flexGrow: 1, p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600, flexGrow: 1, mr: 1, fontSize: '0.9rem' }}>
                                {survey.name}
                              </Typography>
                              <Chip 
                                label="Completed" 
                                size="small" 
                                sx={{ 
                                  bgcolor: theme.palette.success.main, 
                                  color: 'white',
                                  fontWeight: 500,
                                  fontSize: '0.7rem',
                                  height: 20
                                }} 
                              />
                            </Box>
                            
                            <Box sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <PeopleIcon sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  Department: {survey.department || 'All'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ScheduleIcon sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  Ended: {new Date(new Date(survey.publishDate).getTime() + (survey.durationDays * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    timeZone: 'Asia/Kolkata'
                                  })}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                          <Divider />
                          <CardActions sx={{ p: 1.5 }}>
                            <Tooltip title="View Results">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewSurvey(survey._id)}
                                sx={{ 
                                  color: theme.palette.success.main,
                                  '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.08) },
                                  width: 28,
                                  height: 28
                                }}
                              >
                                <TrendingUpIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleViewSurvey(survey._id)}
                              sx={{
                                borderColor: alpha(theme.palette.success.main, 0.3),
                                color: theme.palette.success.main,
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                '&:hover': {
                                  borderColor: theme.palette.success.main,
                                  backgroundColor: alpha(theme.palette.success.main, 0.04),
                                }
                              }}
                            >
                              View Results
                            </Button>
                          </CardActions>
                        </Card>
                      </Fade>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Card sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                  <AssignmentTurnedInIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.9rem' }}>
                    No Completed Surveys
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    There are currently no completed surveys to display.
                  </Typography>
                </Card>
              )}
            </Box>
          </Slide>

          {/* Admin Actions */}
          {isAdmin && (
            <Slide direction="up" in timeout={1600}>
              <Box sx={{ mt: 3 }}>
                <Card sx={{ p: 2.5, borderRadius: 2, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.secondary.main, 0.03)})`, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Typography variant="subtitle1" component="h3" sx={{ mb: 1.5, fontWeight: 600, fontSize: '1rem' }}>
                    Admin Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleCreateSurvey}
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                        },
                        transition: 'all 0.2s ease-in-out',
                        fontSize: '0.8rem',
                        px: 2
                      }}
                    >
                      Create New Survey
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      startIcon={<SettingsIcon />}
                      onClick={handleViewAllSurveys}
                      sx={{
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        fontSize: '0.8rem',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        }
                      }}
                    >
                      Manage Surveys
                    </Button>
                  </Box>
                </Card>
              </Box>
            </Slide>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
