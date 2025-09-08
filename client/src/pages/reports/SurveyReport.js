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
  Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi, reportApi } from '../../services/api';
import { toast } from 'react-toastify';
import DownloadIcon from '@mui/icons-material/Download';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import GroupIcon from '@mui/icons-material/Group';
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

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
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
  const [tabValue, setTabValue] = useState(0);
  const { surveyId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurveyAndReport();
  }, [surveyId]);

  const fetchSurveyAndReport = async () => {
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

      // Fetch report data
      const reportResult = await reportApi.generateSurveyReport(surveyId);
      if (reportResult.success) {
        setReportData(reportResult.data);
      } else {
        toast.error('Failed to generate survey report');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  const handleBack = () => {
    navigate('/surveys');
  };

  const generatePieChartData = (questionData) => {
    const labels = questionData.optionCounts.map(item => item.option);
    const data = questionData.optionCounts.map(item => item.count);
    
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
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const generateParameterChartData = () => {
    if (!reportData || !reportData.parameterStats) return null;
    
    const labels = Object.keys(reportData.parameterStats);
    const data = labels.map(param => reportData.parameterStats[param].averageScore || 0);
    
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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Generating report...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Survey Report
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('pdf')}
              sx={{ mr: 1 }}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('xlsx')}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {survey?.name}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Department: {survey?.department || 'All'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Publish Date: {new Date(survey?.publishDate).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Duration: {survey?.durationDays} days
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {reportData && (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Participation Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="primary">
                      {reportData.totalResponses}
                    </Typography>
                    <Typography variant="body1">Total Responses</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="primary">
                      {reportData.identifiedResponses}
                    </Typography>
                    <Typography variant="body1">Identified Responses</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="primary">
                      {reportData.anonymousResponses}
                    </Typography>
                    <Typography variant="body1">Anonymous Responses</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ mb: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
                  <Tab icon={<PieChartIcon />} label="Question Analysis" />
                  <Tab icon={<BarChartIcon />} label="Parameter Analysis" />
                  <Tab icon={<GroupIcon />} label="Participant Analysis" />
                </Tabs>
              </Box>

              {/* Question Analysis Tab */}
              <TabPanel value={tabValue} index={0}>
                {reportData.questionStats.map((questionStat, index) => (
                  <Box key={questionStat.questionId} sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Question {index + 1}: {questionStat.questionText}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Parameter: {questionStat.parameter}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Option</TableCell>
                                <TableCell align="right">Responses</TableCell>
                                <TableCell align="right">Percentage</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {questionStat.optionCounts.map((option) => (
                                <TableRow key={option.option}>
                                  <TableCell>{option.option}</TableCell>
                                  <TableCell align="right">{option.count}</TableCell>
                                  <TableCell align="right">
                                    {((option.count / questionStat.totalResponses) * 100).toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell><strong>Total</strong></TableCell>
                                <TableCell align="right"><strong>{questionStat.totalResponses}</strong></TableCell>
                                <TableCell align="right"><strong>100%</strong></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          {questionStat.totalResponses > 0 ? (
                            <Pie 
                              data={generatePieChartData(questionStat)} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'bottom',
                                  },
                                },
                              }}
                            />
                          ) : (
                            <Typography variant="body1" color="text.secondary">
                              No data available for this question
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
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
                            <TableCell align="right">Average Score</TableCell>
                            <TableCell align="right">Questions</TableCell>
                            <TableCell align="right">Responses</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(reportData.parameterStats).map(([param, stats]) => (
                            <TableRow key={param}>
                              <TableCell>{param}</TableCell>
                              <TableCell align="right">{stats.averageScore?.toFixed(2) || 'N/A'}</TableCell>
                              <TableCell align="right">{stats.questionCount}</TableCell>
                              <TableCell align="right">{stats.responseCount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              </TabPanel>

              {/* Participant Analysis Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Participant Analysis
                  </Typography>
                  <Typography variant="body2" paragraph>
                    This section shows participation statistics for users who gave consent.
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Consent Statistics
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h3" color="primary">
                            {reportData.consentStats?.totalUsers || 0}
                          </Typography>
                          <Typography variant="body1">Total Users</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h3" color="success.main">
                            {reportData.consentStats?.consentGiven || 0}
                          </Typography>
                          <Typography variant="body1">Consent Given</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h3" color="error.main">
                            {reportData.consentStats?.consentDeclined || 0}
                          </Typography>
                          <Typography variant="body1">Consent Declined</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    Participant List (Consenting Users Only)
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Department</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell align="right">Responses</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.userStats?.length > 0 ? (
                          reportData.userStats.map((user) => (
                            <TableRow key={user.userId}>
                              <TableCell>{user.userName}</TableCell>
                              <TableCell>{user.department}</TableCell>
                              <TableCell align="center">
                                {user.completed ? (
                                  <Chip label="Completed" color="success" size="small" />
                                ) : (
                                  <Chip label="In Progress" color="warning" size="small" />
                                )}
                              </TableCell>
                              <TableCell align="right">{user.responseCount}</TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => navigate(`/reports/users/${user.userId}/surveys/${surveyId}`)}
                                >
                                  View Report
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No consenting users found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </TabPanel>
            </Paper>
          </>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
          <Button variant="outlined" onClick={handleBack}>
            Back to Surveys
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default SurveyReport;

