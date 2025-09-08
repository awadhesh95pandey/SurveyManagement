import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Slide,
  Avatar,
  Stack
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi, reportApi } from '../../services/api';
import { toast } from 'react-toastify';
import DownloadIcon from '@mui/icons-material/Download';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupIcon from '@mui/icons-material/Group';
import ListIcon from '@mui/icons-material/List';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip as ChartTooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  ChartTooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: isMobile ? 2 : 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SurveyReport = () => {
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [detailedResponses, setDetailedResponses] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    fetchSurveyAndReport();
  }, [surveyId]);

  const fetchSurveyAndReport = async () => {
    setLoading(true);
    try {
      // Fetch report data (which now includes survey info)
      const reportResult = await reportApi.generateSurveyReport(surveyId);
      if (reportResult.success) {
        // Extract survey and report data from the new structure
        setSurvey(reportResult.data.survey);
        setReportData(reportResult.data);
      } else {
        toast.error('Failed to generate survey report');
        navigate('/surveys');
        return;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedResponses = async (page = 1) => {
    setLoadingResponses(true);
    try {
      const result = await reportApi.getDetailedSurveyResponses(surveyId, page, 20);
      if (result.success) {
        setDetailedResponses(result.data);
      } else {
        toast.error('Failed to fetch detailed responses');
      }
    } catch (error) {
      console.error('Error fetching detailed responses:', error);
      toast.error('An error occurred while fetching detailed responses');
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Fetch detailed responses when switching to the detailed responses tab
    if (newValue === 3 && !detailedResponses) {
      fetchDetailedResponses(1);
    }
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    fetchDetailedResponses(page);
  };

  const handleExport = async (format) => {
    try {
      await reportApi.exportSurveyResults(surveyId, format);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const handleExportDetailed = async (format) => {
    try {
      await reportApi.exportDetailedSurveyResponses(surveyId, format);
      toast.success(`Detailed responses exported as ${format.toUpperCase()}`);
      setExportMenuAnchor(null);
    } catch (error) {
      console.error('Error exporting detailed responses:', error);
      toast.error('Failed to export detailed responses');
    }
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleBack = () => {
    navigate('/surveys');
  };

  const generatePieChartData = (questionData) => {
    const labels = Object.keys(questionData.distribution);
    const data = Object.values(questionData.distribution);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const generateParameterChartData = () => {
    if (!reportData || !reportData.parameterResults) return null;
    
    const labels = reportData.parameterResults.map(param => param.parameter);
    const data = reportData.parameterResults.map(param => {
      // Calculate average score for each parameter
      let totalScore = 0;
      let totalResponses = 0;
      
      param.questions.forEach(question => {
        const options = Object.keys(question.distribution);
        options.forEach((option, index) => {
          const count = question.distribution[option];
          // Assign scores (assuming 4-point scale, highest option = highest score)
          const score = options.length - index;
          totalScore += score * count;
          totalResponses += count;
        });
      });
      
      return totalResponses > 0 ? totalScore / totalResponses : 0;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Average Score by Parameter',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const calculateDurationDays = () => {
    if (!survey?.publishDate || !survey?.endDate) return 'N/A';
    const start = new Date(survey.publishDate);
    const end = new Date(survey.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            Generating report...
          </Typography>
        </Box>
      </Box>
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
                Survey Report
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
              >
                Comprehensive analysis and insights for survey data
              </Typography>
            </Box>
            <Stack 
              direction={isMobile ? "column" : "row"} 
              spacing={1}
              sx={{ width: isMobile ? '100%' : 'auto' }}
            >
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('pdf')}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  }
                }}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('xlsx')}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  color: theme.palette.secondary.main,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                  }
                }}
              >
                Export Excel
              </Button>
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
                  <PieChartIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                </Avatar>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: isMobile ? '1rem' : '1.25rem' 
                  }}
                >
                  {survey?.name}
                </Typography>
              </Box>
              
              <Grid container spacing={isMobile ? 1 : 2}>
                <Grid item xs={12} sm={4}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Department: {survey?.department || 'All'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Publish Date: {survey?.publishDate ? new Date(survey.publishDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  >
                    Duration: {calculateDurationDays()} days
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Slide>

        {reportData && (
          <>
            {/* Participation Summary */}
            <Slide direction="up" in timeout={1200}>
              <Card sx={{ 
                mb: 2, 
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
                      <GroupIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    </Avatar>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? '1rem' : '1.25rem' 
                      }}
                    >
                      Participation Summary
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={isMobile ? 1.5 : 2}>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ 
                        textAlign: 'center', 
                        p: isMobile ? 1.5 : 2, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.12)})`,
                        borderRadius: 2,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}>
                        <Typography 
                          variant="h4" 
                          color="primary"
                          sx={{ 
                            fontSize: isMobile ? '1.5rem' : '2rem',
                            fontWeight: 700,
                            lineHeight: 1
                          }}
                        >
                          {reportData.participation?.totalAttempts || 0}
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                        >
                          Total Attempts
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ 
                        textAlign: 'center', 
                        p: isMobile ? 1.5 : 2, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, ${alpha(theme.palette.success.main, 0.12)})`,
                        borderRadius: 2,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.1)}`,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                      }}>
                        <Typography 
                          variant="h4" 
                          color="success.main"
                          sx={{ 
                            fontSize: isMobile ? '1.5rem' : '2rem',
                            fontWeight: 700,
                            lineHeight: 1
                          }}
                        >
                          {reportData.participation?.completedAttempts || 0}
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                        >
                          Completed
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ 
                        textAlign: 'center', 
                        p: isMobile ? 1.5 : 2, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)}, ${alpha(theme.palette.info.main, 0.12)})`,
                        borderRadius: 2,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.1)}`,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                      }}>
                        <Typography 
                          variant="h4" 
                          color="info.main"
                          sx={{ 
                            fontSize: isMobile ? '1.5rem' : '2rem',
                            fontWeight: 700,
                            lineHeight: 1
                          }}
                        >
                          {reportData.participation?.identifiedUsers || 0}
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                        >
                          Identified Users
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ 
                        textAlign: 'center', 
                        p: isMobile ? 1.5 : 2, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.grey[500], 0.08)}, ${alpha(theme.palette.grey[500], 0.12)})`,
                        borderRadius: 2,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.grey[500], 0.1)}`,
                        border: `1px solid ${alpha(theme.palette.grey[500], 0.1)}`
                      }}>
                        <Typography 
                          variant="h4" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: isMobile ? '1.5rem' : '2rem',
                            fontWeight: 700,
                            lineHeight: 1
                          }}
                        >
                          {reportData.participation?.anonymousUsers || 0}
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                        >
                          Anonymous Users
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Slide>

            {/* Tabs Section */}
            <Slide direction="up" in timeout={1400}>
              <Card sx={{ 
                mb: 2, 
                borderRadius: 2,
                boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <Box sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  '& .MuiTabs-root': {
                    minHeight: isMobile ? 48 : 64
                  },
                  '& .MuiTab-root': {
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    minHeight: isMobile ? 48 : 64,
                    '&.Mui-selected': {
                      color: theme.palette.primary.main
                    }
                  }
                }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    aria-label="report tabs"
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons={isMobile ? "auto" : false}
                  >
                    <Tab 
                      icon={<PieChartIcon sx={{ fontSize: isMobile ? 18 : 20 }} />} 
                      label="Question Analysis" 
                    />
                    <Tab 
                      icon={<BarChartIcon sx={{ fontSize: isMobile ? 18 : 20 }} />} 
                      label="Parameter Analysis" 
                    />
                    <Tab 
                      icon={<GroupIcon sx={{ fontSize: isMobile ? 18 : 20 }} />} 
                      label="Consent Analysis" 
                    />
                    <Tab 
                      icon={<ListIcon sx={{ fontSize: isMobile ? 18 : 20 }} />} 
                      label="Detailed Responses" 
                    />
                  </Tabs>
                </Box>

                {/* Question Analysis Tab */}
                <TabPanel value={tabValue} index={0}>
                  {reportData.questionResults?.map((questionStat, index) => (
                    <Card key={questionStat.questionId} sx={{ 
                      mb: 2, 
                      borderRadius: 2,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}>
                      <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
                        <Typography 
                          variant={isMobile ? "subtitle1" : "h6"} 
                          gutterBottom
                          sx={{ 
                            fontWeight: 600, 
                            fontSize: isMobile ? '1rem' : '1.25rem' 
                          }}
                        >
                          Question {index + 1}: {questionStat.questionText}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          gutterBottom
                          sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                        >
                          Parameter: {questionStat.parameter}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={isMobile ? 2 : 3}>
                          <Grid item xs={12} md={6}>
                            <TableContainer 
                              component={Paper} 
                              variant="outlined"
                              sx={{ 
                                borderRadius: 2,
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
                              }}
                            >
                              <Table size={isMobile ? "small" : "medium"}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell 
                                      sx={{ 
                                        fontWeight: 600, 
                                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                                        backgroundColor: theme.palette.grey[50]
                                      }}
                                    >
                                      Option
                                    </TableCell>
                                    <TableCell 
                                      align="right"
                                      sx={{ 
                                        fontWeight: 600, 
                                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                                        backgroundColor: theme.palette.grey[50]
                                      }}
                                    >
                                      Responses
                                    </TableCell>
                                    <TableCell 
                                      align="right"
                                      sx={{ 
                                        fontWeight: 600, 
                                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                                        backgroundColor: theme.palette.grey[50]
                                      }}
                                    >
                                      Percentage
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {Object.entries(questionStat.distribution).map(([option, count]) => (
                                    <TableRow 
                                      key={option}
                                      sx={{ 
                                        '&:hover': { 
                                          backgroundColor: theme.palette.action.hover 
                                        }
                                      }}
                                    >
                                      <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                        {option}
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                        {count}
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                        {questionStat.percentages[option]?.toFixed(1) || 0}%
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                                    <TableCell sx={{ fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                      <strong>Total</strong>
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                      <strong>{questionStat.totalResponses}</strong>
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                      <strong>100%</strong>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ 
                              height: isMobile ? 250 : 300, 
                              display: 'flex', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              backgroundColor: alpha(theme.palette.background.paper, 0.5)
                            }}>
                              {questionStat.totalResponses > 0 ? (
                                <Pie 
                                  data={generatePieChartData(questionStat)} 
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'bottom',
                                        labels: {
                                          font: {
                                            size: isMobile ? 10 : 12
                                          }
                                        }
                                      },
                                    },
                                  }}
                                />
                              ) : (
                                <Typography 
                                  variant="body1" 
                                  color="text.secondary"
                                  sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                                >
                                  No data available for this question
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </TabPanel>

              {/* Parameter Analysis Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Parameter Analysis
                  </Typography>
                  <Typography variant="body2" paragraph>
                    This chart shows the average score for each parameter category in the survey.
                  </Typography>
                  <Box sx={{ height: 400, mt: 4 }}>
                    {generateParameterChartData() ? (
                      <Bar 
                        data={generateParameterChartData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            title: {
                              display: true,
                              text: 'Average Score by Parameter',
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 5,
                            },
                          },
                        }}
                      />
                    ) : (
                      <Typography variant="body1" color="text.secondary" align="center">
                        No parameter data available
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mt: 4 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Parameter</TableCell>
                            <TableCell align="right">Questions</TableCell>
                            <TableCell align="right">Total Responses</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.parameterResults?.map((param) => (
                            <TableRow key={param.parameter}>
                              <TableCell>{param.parameter}</TableCell>
                              <TableCell align="right">{param.questions?.length || 0}</TableCell>
                              <TableCell align="right">
                                {param.questions?.reduce((total, q) => total + q.totalResponses, 0) || 0}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              </TabPanel>

              {/* Consent Analysis Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Consent Analysis
                  </Typography>
                  <Typography variant="body2" paragraph>
                    This section shows consent statistics for the survey.
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Consent Statistics
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h3" color="primary">
                            {reportData.consent?.totalConsents || 0}
                          </Typography>
                          <Typography variant="body1">Total Consents</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h3" color="success.main">
                            {reportData.consent?.consentGiven || 0}
                          </Typography>
                          <Typography variant="body1">Consent Given</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h3" color="error.main">
                            {reportData.consent?.consentDenied || 0}
                          </Typography>
                          <Typography variant="body1">Consent Denied</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h3" color="warning.main">
                            {reportData.consent?.noResponse || 0}
                          </Typography>
                          <Typography variant="body1">No Response</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary">
                        Consent Rate: {reportData.consent?.consentRate || 0}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </TabPanel>

              {/* Detailed Responses Tab */}
              <TabPanel value={tabValue} index={3}>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Detailed Survey Responses
                    </Typography>
                    <Box>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportMenuOpen}
                        sx={{ mr: 1 }}
                      >
                        Export Responses
                      </Button>
                      <Menu
                        anchorEl={exportMenuAnchor}
                        open={Boolean(exportMenuAnchor)}
                        onClose={handleExportMenuClose}
                      >
                        <MenuItem onClick={() => handleExportDetailed('csv')}>
                          Export as CSV
                        </MenuItem>
                        <MenuItem onClick={() => handleExportDetailed('xlsx')}>
                          Export as Excel
                        </MenuItem>
                      </Menu>
                    </Box>
                  </Box>

                  {loadingResponses ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : detailedResponses ? (
                    <>
                      {/* Statistics Summary */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="primary">
                                {detailedResponses.statistics?.totalParticipants || 0}
                              </Typography>
                              <Typography variant="body2">Total Participants</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="success.main">
                                {detailedResponses.statistics?.completedParticipants || 0}
                              </Typography>
                              <Typography variant="body2">Completed</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="info.main">
                                {detailedResponses.statistics?.authenticatedParticipants || 0}
                              </Typography>
                              <Typography variant="body2">Authenticated</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="warning.main">
                                {detailedResponses.statistics?.tokenParticipants || 0}
                              </Typography>
                              <Typography variant="body2">Token-based</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="text.secondary">
                                {detailedResponses.statistics?.anonymousParticipants || 0}
                              </Typography>
                              <Typography variant="body2">Anonymous</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* Responses List */}
                      <Box sx={{ mb: 3 }}>
                        {detailedResponses.responses?.map((participant, index) => (
                          <Accordion key={participant.participant?.id || index} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="subtitle1">
                                    {participant.participant?.name || 'Anonymous'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {participant.participant?.email || 'N/A'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {participant.participant?.department || 'N/A'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {participant.submittedAt ? new Date(participant.submittedAt).toLocaleString() : 'N/A'}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={participant.completed ? 'Completed' : 'In Progress'} 
                                  color={participant.completed ? 'success' : 'warning'} 
                                  size="small"
                                />
                                <Chip 
                                  label={participant.participant?.type || 'unknown'} 
                                  variant="outlined" 
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Question</TableCell>
                                      <TableCell>Parameter</TableCell>
                                      <TableCell>Selected Answer</TableCell>
                                      <TableCell>Submitted At</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {participant.responses?.length > 0 ? (
                                      participant.responses
                                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                                        .map((response, idx) => (
                                        <TableRow key={response.questionId || idx}>
                                          <TableCell>
                                            <Typography variant="body2">
                                              {response.questionText}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={response.parameter || 'N/A'} 
                                              size="small" 
                                              variant="outlined"
                                            />
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                              {response.selectedOption}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                              {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : 'N/A'}
                                            </Typography>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={4} align="center">
                                          No responses available
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>

                      {/* Pagination */}
                      {detailedResponses.pagination?.totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                          <Pagination
                            count={detailedResponses.pagination.totalPages}
                            page={detailedResponses.pagination.currentPage}
                            onChange={handlePageChange}
                            color="primary"
                            showFirstButton
                            showLastButton
                          />
                        </Box>
                      )}
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary" align="center">
                      Click on this tab to load detailed responses
                    </Typography>
                  )}
                </Box>
              </TabPanel>
              </Card>
            </Slide>
          </>
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
              Back to Surveys
            </Button>
          </Box>
        </Slide>
      </Container>
    </Box>
  );
};

export default SurveyReport;