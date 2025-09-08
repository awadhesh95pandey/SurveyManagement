import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Alert,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  alpha,
  Fade,
  Slide,
  Avatar
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { consentApi, surveyApi } from '../../services/api';
import { toast } from 'react-toastify';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import DepartmentSurveyDistribution from '../../components/survey/DepartmentSurveyDistribution';

const ConsentStatus = () => {
  const [survey, setSurvey] = useState(null);
  const [consentData, setConsentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    fetchSurveyAndConsent();
  }, [surveyId]);

  const fetchSurveyAndConsent = async () => {
    debugger
    setLoading(true);
    try {
      // Fetch survey details
      const surveyResult = await surveyApi.getSurvey(surveyId);
      if (surveyResult.success) {
        setSurvey(surveyResult.data);
      } else {
        toast.error('Failed to fetch survey details');
        navigate('/surveys');
        return;
      }

      // Fetch consent data
      const consentResult = await consentApi.getConsentStatus(surveyId);
      if (consentResult.success) {
        setConsentData(consentResult.data);
      } else {
        toast.error('Failed to fetch consent data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendConsentEmails = async () => {
    debugger
    setSendingEmails(true);
    try {
      const result = await consentApi.sendConsentEmails(surveyId);
      if (result.success) {
        toast.success('Consent emails sent successfully');
        fetchSurveyAndConsent(); // Refresh data
      } else {
        toast.error(result.message || 'Failed to send consent emails');
      }
    } catch (error) {
      console.error('Error sending consent emails:', error);
      toast.error('An error occurred while sending consent emails');
    } finally {
      setSendingEmails(false);
    }
  };

  const getConsentStats = () => {
    debugger
    const total = consentData.length;
    const consented = consentData.filter(item => item.consentGiven === true).length;
    const declined = consentData.filter(item => item.consentGiven === false).length;
    const pending = total - consented - declined;

    return { total, consented, declined, pending };
  };

  const getConsentChip = (consentGiven) => {
    const chipSize = isMobile ? "small" : "small";
    const iconSize = isMobile ? 16 : 18;
    
    if (consentGiven === true) {
      return (
        <Chip 
          icon={<CheckCircleIcon sx={{ fontSize: iconSize }} />} 
          label="Consented" 
          color="success" 
          size={chipSize}
          sx={{ 
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            height: isMobile ? 24 : 28
          }}
        />
      );
    } else if (consentGiven === false) {
      return (
        <Chip 
          icon={<CancelIcon sx={{ fontSize: iconSize }} />} 
          label="Declined" 
          color="error" 
          size={chipSize}
          sx={{ 
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            height: isMobile ? 24 : 28
          }}
        />
      );
    } else {
      return (
        <Chip 
          icon={<PendingIcon sx={{ fontSize: iconSize }} />} 
          label="Pending" 
          color="warning" 
          size={chipSize}
          sx={{ 
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            height: isMobile ? 24 : 28
          }}
        />
      );
    }
  };

  const getDepatmentName = (departmentId) => {
    debugger
    if (departmentId != "" || survey) 
      return survey.department;
    return 'Unknown';
  };

  const isConsentPeriodActive = () => {
    if (!survey) return false;
    const now = new Date();
    const publishDate = new Date(survey.publishDate);
    return now < publishDate;
  };

  const handleBack = () => {
    navigate(`/surveys/${surveyId}`);
  };

  const handleSendToDepartments = () => {
    setShowDepartmentDialog(true);
  };

  const handleDistributionComplete = (distributionData) => {
    // Refresh consent data after distribution
    fetchSurveyAndConsent();
    setShowDepartmentDialog(false);
    toast.success('Survey links distributed successfully!');
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
        <CircularProgress size={isMobile ? 30 : 40} />
      </Box>
    );
  }

  const stats = getConsentStats();

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
        {/* Header Section */}
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
                Consent Management
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
              >
                Manage survey consent requests and track responses
              </Typography>
            </Box>
            <Stack 
              direction={isMobile ? "column" : "row"} 
              spacing={1}
              sx={{ width: isMobile ? '100%' : 'auto' }}
            >
              {isConsentPeriodActive() && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EmailIcon />}
                  onClick={handleSendConsentEmails}
                  disabled={sendingEmails}
                  size={isMobile ? "small" : "medium"}
                  fullWidth={isMobile}
                  sx={{ 
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    minHeight: isMobile ? 36 : 40,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    },
                    transition: 'all 0.2s ease-in-out',
                    '&:disabled': {
                      background: theme.palette.action.disabledBackground,
                      color: theme.palette.action.disabled,
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {sendingEmails ? 'Sending...' : 'Send Consent Emails'}
                </Button>
              )}
              {stats.consented > 0 && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<BusinessIcon />}
                  onClick={handleSendToDepartments}
                  size={isMobile ? "small" : "medium"}
                  fullWidth={isMobile}
                  sx={{ 
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.2)}`,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    minHeight: isMobile ? 36 : 40,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Send Survey Links
                </Button>
              )}
            </Stack>
          </Box>
        </Fade>

        {/* Survey Info Card */}
        <Slide direction="up" in timeout={1000}>
          <Card sx={{ 
            mb: 2, 
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1), 
                  width: 32, 
                  height: 32, 
                  mr: 1.5 
                }}>
                  <CheckCircleIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                </Avatar>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: isMobile ? '1rem' : '1.25rem' 
                  }}
                >
                  Survey: {survey?.name}
                </Typography>
              </Box>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
              >
                Publish Date: {survey?.publishDate ? new Date(survey.publishDate).toLocaleDateString() : 'Not set'}
              </Typography>
              
              {!isConsentPeriodActive() && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mt: 1.5, 
                    borderRadius: 2,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    '& .MuiAlert-message': {
                      fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }
                  }}
                >
                  Consent period has ended. Survey is now active or closed.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Slide>

        {/* Consent Statistics */}
        <Slide direction="up" in timeout={1200}>
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
                    Total Invitations
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                  >
                    {stats.total}
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
                    Consented
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
                    {stats.consented}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
                height: '100%', 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)}, ${alpha(theme.palette.error.main, 0.12)})`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.1)}`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': { 
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.15)}`
                }
              }}>
                <CardContent sx={{ p: isMobile ? 1.5 : 2, '&:last-child': { pb: isMobile ? 1.5 : 2 } }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                    sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem', fontWeight: 500 }}
                  >
                    Declined
                  </Typography>
                  <Typography 
                    variant="h4" 
                    color="error.main"
                    sx={{ 
                      fontSize: isMobile ? '1.5rem' : '2rem',
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                  >
                    {stats.declined}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
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
                    Pending
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
                    {stats.pending}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Slide>

        {/* Consent Details Table */}
        {consentData.length > 0 ? (
          <Slide direction="up" in timeout={1400}>
            <Card sx={{ 
              width: '100%', 
              borderRadius: 2,
              boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Box sx={{ p: isMobile ? 2 : 3, pb: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      width: 32, 
                      height: 32, 
                      mr: 1.5 
                    }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    </Avatar>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? '1rem' : '1.25rem' 
                      }}
                    >
                      Consent Details
                    </Typography>
                  </Box>
                </Box>
                
                <TableContainer sx={{ 
                  maxHeight: isMobile ? 400 : 600,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                    height: '6px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '3px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#c1c1c1',
                    borderRadius: '3px',
                    '&:hover': {
                      background: '#a8a8a8'
                    }
                  }
                }}>
                  <Table stickyHeader size={isMobile ? "small" : "medium"}>
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            backgroundColor: theme.palette.grey[50]
                          }}
                        >
                          Employee Name
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            backgroundColor: theme.palette.grey[50]
                          }}
                        >
                          Email
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            backgroundColor: theme.palette.grey[50]
                          }}
                        >
                          Department
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            backgroundColor: theme.palette.grey[50]
                          }}
                        >
                          Status
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            backgroundColor: theme.palette.grey[50]
                          }}
                        >
                          Response Date
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consentData.map((consent) => (
                        <TableRow 
                          key={consent._id} 
                          hover
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: theme.palette.action.hover 
                            }
                          }}
                        >
                          <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {consent.userId?.name || 'Unknown'}
                          </TableCell>
                          <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {consent.userId?.email || 'Unknown'}
                          </TableCell>
                          <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {consent.userId?.department || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {getConsentChip(consent.consentGiven)}
                          </TableCell>
                          <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {consent.consentTimestamp 
                              ? new Date(consent.consentTimestamp).toLocaleDateString()
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Slide>
        ) : (
          <Slide direction="up" in timeout={1400}>
            <Card sx={{ 
              p: isMobile ? 3 : 4, 
              textAlign: 'center', 
              borderRadius: 2,
              boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.warning.main, 0.1), 
                  width: 64, 
                  height: 64, 
                  mx: 'auto',
                  mb: 2
                }}>
                  <EmailIcon sx={{ fontSize: 32, color: theme.palette.warning.main }} />
                </Avatar>
                
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  gutterBottom
                  sx={{ fontWeight: 600, fontSize: isMobile ? '1rem' : '1.25rem' }}
                >
                  No Consent Data Found
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  paragraph
                  sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                >
                  No consent requests have been sent for this survey yet.
                </Typography>
                {isConsentPeriodActive() && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EmailIcon />}
                    onClick={handleSendConsentEmails}
                    disabled={sendingEmails}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      minHeight: isMobile ? 36 : 40,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                      transition: 'all 0.2s ease-in-out',
                      '&:disabled': {
                        background: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {sendingEmails ? 'Sending...' : 'Send Consent Emails'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Slide>
          </Grid>
        </Grid>

        {/* Consent Details Table */}
        {consentData.length > 0 ? (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Response Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consentData.map((consent) => (
                    <TableRow key={consent._id} hover>
                      <TableCell>{consent.userId?.name || 'Unknown'}</TableCell>
                      <TableCell>{consent.userId?.email || 'Unknown'}</TableCell>
                      <TableCell>{getDepatmentName(consent.userId?.department)}</TableCell>
                      <TableCell>{getConsentChip(consent.consentGiven)}</TableCell>
                      <TableCell>
                        {consent.consentTimestamp 
                          ? new Date(consent.consentTimestamp).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No Consent Data Found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              No consent requests have been sent for this survey yet.
            </Typography>
            {isConsentPeriodActive() && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EmailIcon />}
                onClick={handleSendConsentEmails}
                disabled={sendingEmails}
              >
                {sendingEmails ? 'Sending...' : 'Send Consent Emails'}
              </Button>
            )}
          </Paper>
        )}

        <Slide direction="up" in timeout={1600}>
          <Box sx={{ 
            mt: 2, 
            display: 'flex', 
            justifyContent: 'flex-start' 
          }}>
            <Button 
              variant="outlined" 
              onClick={handleBack}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                borderColor: alpha(theme.palette.primary.main, 0.3),
                color: theme.palette.primary.main,
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                minHeight: isMobile ? 36 : 40,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }
              }}
            >
              Back to Survey
            </Button>
          </Box>
        </Slide>

        {/* Department Survey Distribution Dialog */}
        <DepartmentSurveyDistribution
          open={showDepartmentDialog}
          onClose={() => setShowDepartmentDialog(false)}
          surveyId={surveyId}
          surveyTitle={survey?.name}
          onDistributionComplete={handleDistributionComplete}
        />
      </Container>
    </Box>
  );
};

export default ConsentStatus;
