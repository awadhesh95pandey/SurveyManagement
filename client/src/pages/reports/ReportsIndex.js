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
  IconButton
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
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await surveyApi.getSurveys();
      if (result.success) {
        const surveysData = result.data;
        const totalSurveys = surveysData.length;
        const activeSurveys = surveysData.filter(s => s.status === 'active').length;
        const completedSurveys = surveysData.filter(s => s.status === 'completed').length;
        
        // Calculate total responses (this would need to be enhanced with actual response data)
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Reports Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={1}>
            View and analyze survey data and insights
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <AssessmentIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.totalSurveys}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Surveys
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <TrendingUpIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.activeSurveys}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Surveys
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <BarChartIcon color="info" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.completedSurveys}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Surveys
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <PersonIcon color="warning" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h4" component="div" fontWeight="bold">
                {stats.totalResponses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Responses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" fontWeight="bold" mb={3}>
              Quick Actions
            </Typography>
            
            <Grid container spacing={2}>
              {isAdmin && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <AdminIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Admin Reports
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Access comprehensive survey analytics and export data
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<BarChartIcon />}
                        onClick={() => navigate('/reports/surveys')}
                      >
                        View All Reports
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent sx={{ pb: 1 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <PersonIcon color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1" fontWeight="bold">
                        My Reports
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      View your personal survey participation and responses
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/reports/users/${user._id}`)}
                    >
                      View My Reports
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Reports */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" fontWeight="bold" mb={3}>
              Recent Reports Available
            </Typography>
            
            {recentReports.length > 0 ? (
              <List>
                {recentReports.map((survey, index) => (
                  <React.Fragment key={survey._id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <PieChartIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={survey.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {survey.responseCount || 0} responses
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {survey.publishDate ? formatDate(survey.publishDate) : 'Not published'}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box>
                        <Chip 
                          label={survey.status} 
                          size="small"
                          color={survey.status === 'active' ? 'success' : 'default'}
                          sx={{ mr: 1 }}
                        />
                        {isAdmin && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewSurveyReport(survey._id)}
                            title="View Survey Report"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewUserReport(survey._id)}
                          title="View My Report"
                        >
                          <PersonIcon />
                        </IconButton>
                        {isAdmin && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleExportReport(survey._id)}
                            title="Export Report"
                          >
                            <DownloadIcon />
                          </IconButton>
                        )}
                      </Box>
                    </ListItem>
                    {index < recentReports.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No reports available yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete some surveys to generate reports
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportsIndex;
