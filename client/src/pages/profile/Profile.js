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
  IconButton,
  alpha,
  useTheme,
  Fade,
  Slide,
  Tooltip
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
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { authApi, surveyApi, responseApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user } = useAuth();
  const theme = useTheme();
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
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
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
        <Container maxWidth={false} sx={{ position: 'relative', zIndex: 1, py: 2 }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            onClick={handleRefresh} 
            startIcon={<RefreshIcon />}
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Try Again
          </Button>
        </Container>
      </Box>
    );
  }

  const userData = profileData || user;

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
      <Container maxWidth={false} sx={{ position: 'relative', zIndex: 1, py: 2 }}>
        {/* Header */}
        <Fade in timeout={800}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
              My Profile
            </Typography>
            <Tooltip title="Refresh Profile" arrow>
              <IconButton 
                onClick={handleRefresh} 
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <RefreshIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>

        <Grid container spacing={2}>
          {/* Profile Information Card */}
          <Grid item xs={12} md={4}>
            <Slide direction="up" in timeout={1000}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                height: 'fit-content'
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mb: 1.5,
                        bgcolor: theme.palette.primary.main,
                        fontSize: '1.5rem',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                      }}
                    >
                      {getInitials(userData?.name)}
                    </Avatar>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', mb: 0.5 }}>
                      {userData?.name || 'Unknown User'}
                    </Typography>
                    <Chip 
                      label={userData?.role || 'User'} 
                      size="small"
                      sx={{ 
                        bgcolor: userData?.role === 'admin' ? theme.palette.primary.main : theme.palette.secondary.main,
                        color: 'white',
                        fontSize: '0.75rem',
                        height: 24,
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <List sx={{ py: 0 }}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <EmailIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Email</Typography>}
                        secondary={<Typography sx={{ fontSize: '0.75rem' }}>{userData?.email || 'Not provided'}</Typography>}
                      />
                    </ListItem>

                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <BusinessIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Department</Typography>}
                        secondary={<Typography sx={{ fontSize: '0.75rem' }}>{userData?.department?.name || 'Not assigned'}</Typography>}
                      />
                    </ListItem>

                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <WorkIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Position</Typography>}
                        secondary={<Typography sx={{ fontSize: '0.75rem' }}>{userData?.position || 'Not specified'}</Typography>}
                      />
                    </ListItem>

                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CalendarIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Joined</Typography>}
                        secondary={<Typography sx={{ fontSize: '0.75rem' }}>{userData?.createdAt ? formatDate(userData.createdAt) : 'Unknown'}</Typography>}
                      />
                    </ListItem>
                  </List>

                  {/* Edit Profile Button - Future Enhancement */}
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<EditIcon />}
                      disabled
                      size="small"
                      sx={{ 
                        opacity: 0.6,
                        fontSize: '0.8rem',
                        py: 1
                      }}
                    >
                      Edit Profile (Coming Soon)
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Slide>
          </Grid>

          {/* Statistics and Activity */}
          <Grid item xs={12} md={8}>
            {/* Statistics Cards */}
            <Slide direction="up" in timeout={1200}>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ 
                    borderRadius: 2,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 1.5, px: 1 }}>
                      <AssignmentIcon sx={{ fontSize: 28, mb: 0.5, color: theme.palette.primary.main }} />
                      <Typography variant="h5" component="div" sx={{ fontWeight: 600, fontSize: '1.2rem' }}>
                        {userStats.totalSurveys}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        Total Surveys
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Card sx={{ 
                    borderRadius: 2,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 1.5, px: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 28, mb: 0.5, color: theme.palette.success.main }} />
                      <Typography variant="h5" component="div" sx={{ fontWeight: 600, fontSize: '1.2rem' }}>
                        {userStats.completedSurveys}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        Completed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Card sx={{ 
                    borderRadius: 2,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 1.5, px: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 28, mb: 0.5, color: theme.palette.warning.main }} />
                      <Typography variant="h5" component="div" sx={{ fontWeight: 600, fontSize: '1.2rem' }}>
                        {userStats.pendingSurveys}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        Pending
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6} sm={3}>
                  <Card sx={{ 
                    borderRadius: 2,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 1.5, px: 1 }}>
                      <TrendingUpIcon sx={{ fontSize: 28, mb: 0.5, color: theme.palette.info.main }} />
                      <Typography variant="h5" component="div" sx={{ fontWeight: 600, fontSize: '1.2rem' }}>
                        {userStats.participationRate}%
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        Participation
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Slide>

            {/* Recent Activity */}
            <Slide direction="up" in timeout={1400}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      width: 28, 
                      height: 28, 
                      mr: 1 
                    }}>
                      <HistoryIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                    </Avatar>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      Recent Activity
                    </Typography>
                  </Box>
                  
                  {recentActivity.length > 0 ? (
                    <List sx={{ py: 0 }}>
                      {recentActivity.map((activity, index) => (
                        <Fade in timeout={1600 + index * 100} key={activity._id || index}>
                          <React.Fragment>
                            <ListItem sx={{ px: 0, py: 1 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircleIcon 
                                  sx={{ 
                                    fontSize: 18,
                                    color: activity.status === 'completed' ? theme.palette.success.main : theme.palette.warning.main
                                  }}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                    Survey: {activity.survey?.title || 'Unknown Survey'}
                                  </Typography>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                      Status: {activity.status || 'Unknown'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                      {activity.updatedAt ? formatDate(activity.updatedAt) : 'Unknown date'}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < recentActivity.length - 1 && <Divider sx={{ my: 0.5 }} />}
                          </React.Fragment>
                        </Fade>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        width: 48, 
                        height: 48, 
                        mx: 'auto',
                        mb: 1.5
                      }}>
                        <AssessmentIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Typography variant="body1" sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 0.5 }}>
                        No recent activity found
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        Complete some surveys to see your activity here
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Slide>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile;
