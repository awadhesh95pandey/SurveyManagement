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
  MenuItem
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
  const [detailedResponses, setDetailedResponses] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
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
                  <Tab icon={<ListIcon />} label="Detailed Responses" />
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
                                {detailedResponses.statistics.totalParticipants}
                              </Typography>
                              <Typography variant="body2">Total Participants</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="success.main">
                                {detailedResponses.statistics.completedParticipants}
                              </Typography>
                              <Typography variant="body2">Completed</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="info.main">
                                {detailedResponses.statistics.authenticatedParticipants}
                              </Typography>
                              <Typography variant="body2">Authenticated</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="warning.main">
                                {detailedResponses.statistics.tokenParticipants}
                              </Typography>
                              <Typography variant="body2">Token-based</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2.4}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="text.secondary">
                                {detailedResponses.statistics.anonymousParticipants}
                              </Typography>
                              <Typography variant="body2">Anonymous</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* Responses List */}
                      <Box sx={{ mb: 3 }}>
                        {detailedResponses.responses.map((participant, index) => (
                          <Accordion key={participant.participant.id} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="subtitle1">
                                    {participant.participant.name}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {participant.participant.email}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {participant.participant.department}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                  <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(participant.submittedAt).toLocaleString()}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={participant.completed ? 'Completed' : 'In Progress'} 
                                  color={participant.completed ? 'success' : 'warning'} 
                                  size="small"
                                />
                                <Chip 
                                  label={participant.participant.type} 
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
                                    {participant.responses
                                      .sort((a, b) => a.order - b.order)
                                      .map((response) => (
                                      <TableRow key={response.questionId}>
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
                                            {new Date(response.submittedAt).toLocaleString()}
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>

                      {/* Pagination */}
                      {detailedResponses.pagination.totalPages > 1 && (
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
