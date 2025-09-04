import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { authApi, surveyApi, responseApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState({
    totalSurveys: 0,
    completedSurveys: 0,
    pendingSurveys: 0,
    participationRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
    fetchUserStats();
    fetchRecentActivity();
  }, []);

  const fetchProfileData = async () => {
    try {
      const result = await authApi.getProfile();
      if (result.success) {
        setProfileData(result.data);
      } else {
        setError(result.message);
        toast.error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('An error occurred while fetching profile data');
      toast.error('An error occurred while fetching profile data');
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get user's surveys and responses to calculate statistics
      const surveysResult = await surveyApi.getSurveys();
      const responsesResult = await responseApi.getUserResponses();
      
      if (surveysResult.success && responsesResult.success) {
        const totalSurveys = surveysResult.data.length;
        const completedSurveys = responsesResult.data.filter(r => r.status === 'completed').length;
        const pendingSurveys = totalSurveys - completedSurveys;
        const participationRate = totalSurveys > 0 ? Math.round((completedSurveys / totalSurveys) * 100) : 0;

        setUserStats({
          totalSurveys,
          completedSurveys,
          pendingSurveys,
          participationRate
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Get recent responses for activity feed
      const result = await responseApi.getUserResponses({ limit: 5 });
      if (result.success) {
        setRecentActivity(result.data);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchProfileData();
    fetchUserStats();
    fetchRecentActivity();
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'U';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const userData = profileData || user;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          My Profile
        </Typography>
        <IconButton onClick={handleRefresh} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: 'fit-content' }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {getInitials(userData?.name)}
              </Avatar>
              <Typography variant="h5" component="h2" fontWeight="bold" textAlign="center">
                {userData?.name || 'Unknown User'}
              </Typography>
              <Chip 
                label={userData?.role || 'User'} 
                color={userData?.role === 'admin' ? 'primary' : 'secondary'}
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Email" 
                  secondary={userData?.email || 'Not provided'} 
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <BusinessIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Department" 
                  secondary={userData?.department?.name || 'Not assigned'} 
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <WorkIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Position" 
                  secondary={userData?.position || 'Not specified'} 
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <CalendarIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Joined" 
                  secondary={userData?.createdAt ? formatDate(userData.createdAt) : 'Unknown'} 
                />
              </ListItem>
            </List>

            {/* Edit Profile Button - Future Enhancement */}
            <Box mt={3}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<EditIcon />}
                disabled
                sx={{ opacity: 0.6 }}
              >
                Edit Profile (Coming Soon)
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Statistics and Activity */}
        <Grid item xs={12} md={8}>
          {/* Statistics Cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <AssignmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {userStats.totalSurveys}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Surveys
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {userStats.completedSurveys}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <ScheduleIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {userStats.pendingSurveys}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Card elevation={2}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <PersonIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {userStats.participationRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Participation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Activity */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" fontWeight="bold" mb={2}>
              Recent Activity
            </Typography>
            
            {recentActivity.length > 0 ? (
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity._id || index}>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon 
                          color={activity.status === 'completed' ? 'success' : 'warning'} 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Survey: ${activity.survey?.title || 'Unknown Survey'}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Status: {activity.status || 'Unknown'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {activity.updatedAt ? formatDate(activity.updatedAt) : 'Unknown date'}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={4}>
                <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No recent activity found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete some surveys to see your activity here
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
