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
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { surveyApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [activeSurveys, setActiveSurveys] = useState([]);
  const [upcomingSurveys, setUpcomingSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        {/* Stats Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'primary.light',
                color: 'white',
              }}
            >
              <AssignmentIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {loading ? <CircularProgress size={24} color="inherit" /> : activeSurveys.length}
              </Typography>
              <Typography variant="body1">Active Surveys</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'secondary.light',
                color: 'white',
              }}
            >
              <PendingActionsIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {loading ? <CircularProgress size={24} color="inherit" /> : upcomingSurveys.length}
              </Typography>
              <Typography variant="body1">Upcoming Surveys</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'success.light',
                color: 'white',
              }}
            >
              <AssignmentTurnedInIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" component="div">
                {loading ? <CircularProgress size={24} color="inherit" /> : '0'}
              </Typography>
              <Typography variant="body1">Completed Surveys</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Active Surveys Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Active Surveys
            </Typography>
            <Button variant="outlined" onClick={handleViewAllSurveys}>
              View All
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : activeSurveys.length > 0 ? (
            <Grid container spacing={3}>
              {activeSurveys.map((survey) => (
                <Grid item xs={12} sm={6} md={4} key={survey._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div" noWrap>
                        {survey.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Department: {survey.department || 'All'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Publish Date: {survey.publishDate 
                          ? new Date(survey.publishDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              timeZone: 'Asia/Kolkata'
                            }) 
                          : ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
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
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button size="small" onClick={() => handleViewSurvey(survey._id)}>
                        View
                      </Button>
                      <Button size="small" color="primary" onClick={() => handleAttemptSurvey(survey._id)}>
                        Take Survey
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No active surveys available.</Typography>
            </Paper>
          )}
        </Box>

        {/* Upcoming Surveys Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            Upcoming Surveys
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : upcomingSurveys.length > 0 ? (
            <Grid container spacing={3}>
              {upcomingSurveys.map((survey) => (
                <Grid item xs={12} sm={6} md={4} key={survey._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div" noWrap>
                        {survey.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Department: {survey.department || 'All'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Starts on: {new Date(survey.publishDate).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button size="small" onClick={() => handleViewSurvey(survey._id)}>
                        View
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No upcoming surveys available.</Typography>
            </Paper>
          )}
        </Box>

        {/* Admin Actions */}
        {isAdmin && (
          <Box sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Admin Actions
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleCreateSurvey}
                sx={{ mr: 2 }}
              >
                Create New Survey
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleViewAllSurveys}
              >
                Manage Surveys
              </Button>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;

