import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SurveyComplete = () => {
  const navigate = useNavigate();
  const { surveyId } = useParams();

  const handleBackToSurveys = () => {
    navigate('/surveys');
  };

  const handleViewSurvey = () => {
    navigate(`/surveys/${surveyId}`);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon 
            sx={{ 
              fontSize: 80, 
              color: 'success.main', 
              mb: 2 
            }} 
          />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Survey Completed Successfully!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Thank you for taking the time to complete this survey. Your responses have been recorded.
          </Typography>

          <Card sx={{ mt: 3, mb: 3, bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                What happens next?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your responses will be analyzed along with other participants' responses. 
                The survey results will be compiled and shared with the relevant stakeholders.
              </Typography>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleBackToSurveys}
            >
              Back to Surveys
            </Button>
            <Button
              variant="outlined"
              onClick={handleViewSurvey}
            >
              View Survey Details
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SurveyComplete;

