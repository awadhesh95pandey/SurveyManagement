import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Slide,
  Avatar,
  Stack
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { surveyApi, reportApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const ReportsIndex = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [surveys, setSurveys] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    activeSurveys: 0,
    completedSurveys: 0,
    totalResponses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSurveys(),
        fetchStats(),
        fetchRecentReports()
      ]);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      setError('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      const result = await surveyApi.getSurveys();
      if (result.success) {
        setSurveys(result.data);
        // Set recent reports to all surveys for now
        setRecentReports(result.data);
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('Failed to fetch surveys');
    }
  };

const fetchStats = async () => {
  debugger;
  try {
    const result = await surveyApi.getSurveys();
    if (result.success) {
      const surveysData = result.data;
      const totalSurveys = surveysData.length;

      const activeSurveys = surveysData.filter(s => 
        s.currentStatus === "active" ||
        (new Date(s.publishDate) <= new Date() && new Date(s.endDate) >= new Date())
      ).length;

      const completedSurveys = surveysData.filter(s => 
        s.currentStatus === "completed" ||
        (new Date(s.endDate) < new Date())
      ).length;

      // Calculate total responses
      const totalResponses = surveysData.reduce((sum, survey) => {
        return sum + (survey.responseCount || 0);
      }, 0);

      setStats({
        totalSurveys,
        activeSurveys,
        completedSurveys,
        totalResponses
      });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

  const fetchRecentReports = async () => {
    try {
      // Get recent surveys that have reports available
      const result = await surveyApi.getSurveys({ limit: 5 });
      if (result.success) {
        const recentSurveys = result.data
          .filter(survey => survey.status === 'completed' || survey.responseCount > 0)
          .slice(0, 5);
        setRecentReports(recentSurveys);
      }
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    }
  };

  const handleViewSurveyReport = (surveyId) => {
    navigate(`/reports/surveys/${surveyId}`);
  };

  const handleViewUserReport = (surveyId) => {
    navigate(`/reports/users/${user._id}/surveys/${surveyId}`);
  };

  const handleExportReport = async (surveyId) => {
    try {
      const result = await reportApi.exportSurveyResults(surveyId);
      if (result.success) {
        toast.success('Report exported successfully');
        // Handle file download here
      } else {
        toast.error('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('An error occurred while exporting report');
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.01)} 0%, ${alpha('#ffffff', 0.95)} 50%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={isMobile ? 30 : 40} />
          <Typography 
            variant="body1" 
            sx={{ 
              mt: 2, 
              fontSize: isMobile ? '0.875rem' : '1rem' 
            }}
          >
            Loading reports...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Try Again
        </Button>
      </Container>
    );
  }

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
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 2 }}>
        {/* Header */}
        <Fade in timeout={800}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            mb: 2,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
          }}>
            <Box>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                component="h1"
                sx={{ 
                  fontWeight: 600, 
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  color: theme.palette.text.primary,
                  mb: 0.5
                }}
              >
                Reports Dashboard
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
              >
                View and analyze survey data and insights
              </Typography>
            </Box>
            <IconButton 
              onClick={handleRefresh} 
              color="primary"
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Fade>

        {/* Statistics Cards */}
        <Slide direction="up" in timeout={1000}>
          <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.12)})`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                }
              }}>
                <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem', fontWeight: 500 }}
                  >
                    Total Surveys
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                  >
                    {stats.totalSurveys}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, ${alpha(theme.palette.success.main, 0.12)})`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.1)}`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.15)}`
                }
              }}>
                <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem', fontWeight: 500 }}
                  >
                    Active Surveys
                  </Typography>
                  <Typography 
                    variant="h4" 
                    color="success.main"
                    sx={{ 
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                  >
                    {stats.activeSurveys}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)}, ${alpha(theme.palette.info.main, 0.12)})`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.1)}`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.15)}`
                }
              }}>
                <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem', fontWeight: 500 }}
                  >
                    Completed Surveys
                  </Typography>
                  <Typography 
                    variant="h4" 
                    color="info.main"
                    sx={{ 
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                  >
                    {stats.completedSurveys}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
                display: 'none', // Hide total responses for now
                height: '100%', 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)}, ${alpha(theme.palette.warning.main, 0.12)})`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.1)}`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.warning.main, 0.15)}`
                }
              }}>
                <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem', fontWeight: 500 }}
                  >
                    Total Responses
                  </Typography>
                  <Typography 
                    variant="h4" 
                    color="warning.main"
                    sx={{
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                  >
                    {stats.totalResponses}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Slide>


        {/* Survey Reports List */}
        <Grid item xs={12}>
          <Slide direction="up" in timeout={1200}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    width: 32, 
                    height: 32, 
                    mr: 1.5 
                  }}>
                    <AssessmentIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  </Avatar>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: isMobile ? '1rem' : '1.25rem' 
                    }}
                  >
                    Survey Reports
                  </Typography>
                </Box>
                
                {surveys.length > 0 ? (
                  <Grid container spacing={isMobile ? 1 : 2}>
                    {surveys.map((survey) => (
                      <Grid item xs={12} sm={6} md={4} key={survey._id}>
                        <Card sx={{ 
                          height: '100%',
                          borderRadius: 2,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': { 
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`
                          }
                        }}>
                          <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                            <Typography 
                              variant={isMobile ? "subtitle2" : "subtitle1"} 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.875rem' : '1rem',
                                mb: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {survey.name || survey.title}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Chip 
                                label={survey.status || 'draft'} 
                                size="small"
                                color={survey.status === 'active' ? 'success' : survey.status === 'completed' ? 'info' : 'default'}
                                sx={{ 
                                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                                  height: isMobile ? 20 : 24
                                }}
                              />
                            </Box>
                            
                            
                            
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                mb: 2
                              }}
                            >
                              {survey.publishDate ? formatDate(survey.publishDate) : 'Not published'}
                            </Typography>
                          </CardContent>
                          
                          <CardActions sx={{ p: isMobile ? 1 : 1.5, pt: 0 }}>
                            <Button
                              variant="contained"
                              size={isMobile ? "small" : "medium"}
                              fullWidth
                              onClick={() => handleViewSurveyReport(survey._id)}
                              sx={{
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                                  transform: 'translateY(-1px)',
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                                },
                                transition: 'all 0.2s ease-in-out'
                              }}
                            >
                              View Report
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1), 
                      width: 64, 
                      height: 64, 
                      mx: 'auto',
                      mb: 2
                    }}>
                      <AssessmentIcon sx={{ fontSize: 32, color: theme.palette.warning.main }} />
                    </Avatar>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                    >
                      No surveys available yet
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      Create surveys to generate reports
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Container>
    </Box>
  );
};

export default ReportsIndex;
