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
  Alert
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
    const total = consentData.length;
    const consented = consentData.filter(item => item.consentGiven === true).length;
    const declined = consentData.filter(item => item.consentGiven === false).length;
    const pending = total - consented - declined;

    return { total, consented, declined, pending };
  };

  const getConsentChip = (consentGiven) => {
    if (consentGiven === true) {
      return <Chip icon={<CheckCircleIcon />} label="Consented" color="success" size="small" />;
    } else if (consentGiven === false) {
      return <Chip icon={<CancelIcon />} label="Declined" color="error" size="small" />;
    } else {
      return <Chip icon={<PendingIcon />} label="Pending" color="warning" size="small" />;
    }
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
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const stats = getConsentStats();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Consent Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
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
            {stats.consented > 0 && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<BusinessIcon />}
                onClick={handleSendToDepartments}
              >
                Send Survey Links
              </Button>
            )}
          </Box>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Survey: {survey?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Publish Date: {survey?.publishDate ? new Date(survey.publishDate).toLocaleDateString() : 'Not set'}
          </Typography>
          
          {!isConsentPeriodActive() && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Consent period has ended. Survey is now active or closed.
            </Alert>
          )}
        </Paper>

        {/* Consent Statistics */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Invitations
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Consented
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.consented}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Declined
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.declined}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pending}
                </Typography>
              </CardContent>
            </Card>
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
                      <TableCell>{consent.userId?.department || 'Unknown'}</TableCell>
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

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
          <Button variant="outlined" onClick={handleBack}>
            Back to Survey
          </Button>
        </Box>

        {/* Department Survey Distribution Dialog */}
        <DepartmentSurveyDistribution
          open={showDepartmentDialog}
          onClose={() => setShowDepartmentDialog(false)}
          surveyId={surveyId}
          surveyTitle={survey?.name}
          onDistributionComplete={handleDistributionComplete}
        />
      </Box>
    </Container>
  );
};

export default ConsentStatus;
