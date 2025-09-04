import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { reportApi, surveyApi } from '../../services/api';
import { toast } from 'react-toastify';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DownloadIcon from '@mui/icons-material/Download';

const UserReport = () => {
  const [userReport, setUserReport] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId, surveyId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserReport();
  }, [userId, surveyId]);

  const fetchUserReport = async () => {
    setLoading(true);
    try {
      // Fetch survey details
      const surveyResult = await surveyApi.getSurvey(surveyId);
      if (surveyResult.success) {
        setSurvey(surveyResult.data);
      }

      // Fetch user report
      const reportResult = await reportApi.getUserReport(userId, surveyId);
      if (reportResult.success) {
        setUserReport(reportResult.data);
      } else {
        toast.error('Failed to fetch user report');
      }
    } catch (error) {
      console.error('Error fetching user report:', error);
      toast.error('An error occurred while fetching the report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const result = await reportApi.exportUserReportPDF(userId, surveyId);
      if (result.success) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([result.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `user-report-${userId}-${surveyId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Report exported successfully');
      } else {
        toast.error('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('An error occurred while exporting the report');
    }
  };

  const handleExportExcel = async () => {
    try {
      const result = await reportApi.exportUserReportExcel(userId, surveyId);
      if (result.success) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([result.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `user-report-${userId}-${surveyId}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Report exported successfully');
      } else {
        toast.error('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('An error occurred while exporting the report');
    }
  };

  const handleBack = () => {
    navigate(`/reports/surveys/${surveyId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!userReport) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            User report not found or user did not consent to data collection.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={handleBack}>
              Back to Survey Report
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            User Survey Report
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportPDF}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        {/* Report Header */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">User Information</Typography>
                </Box>
                <Typography variant="body1">
                  <strong>Name:</strong> {userReport.user?.name || 'Unknown'}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {userReport.user?.email || 'Unknown'}
                </Typography>
                <Typography variant="body1">
                  <strong>Department:</strong> {userReport.user?.department || 'Unknown'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Survey Information</Typography>
                </Box>
                <Typography variant="body1">
                  <strong>Survey:</strong> {survey?.name || 'Unknown'}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Questions:</strong> {userReport.responses?.length || 0}
                </Typography>
                <Typography variant="body1">
                  <strong>Completion Rate:</strong> 100%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DateRangeIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Response Details</Typography>
                </Box>
                <Typography variant="body1">
                  <strong>Submitted:</strong> {userReport.submittedAt 
                    ? new Date(userReport.submittedAt).toLocaleDateString()
                    : 'Unknown'
                  }
                </Typography>
                <Typography variant="body1">
                  <strong>Consent Given:</strong> Yes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Responses Table */}
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Survey Responses
            </Typography>
          </Box>
          <Divider />
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell>Response</TableCell>
                  <TableCell>Parameter</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userReport.responses?.map((response, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ maxWidth: 400 }}>
                      <Typography variant="body2">
                        {response.question?.questionText || 'Question not found'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {response.selectedOption}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {response.question?.parameter || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button variant="outlined" onClick={handleBack}>
            Back to Survey Report
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default UserReport;

