import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi, questionApi, responseApi, consentApi } from '../../services/api';
import { toast } from 'react-toastify';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SurveyAttempt = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [consentStatus, setConsentStatus] = useState(null);
  const { surveyId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurveyData();
  }, [surveyId]);

  const fetchSurveyData = async () => {
    setLoading(true);
    try {
      // Check if survey is active
      const surveyResult = await surveyApi.getSurvey(surveyId);
      if (!surveyResult.success) {
        toast.error('Failed to fetch survey details');
        navigate('/surveys');
        return;
      }
      
      const survey = surveyResult.data;
      setSurvey(survey);
      
      // Check if survey is active
      const now = new Date();
      const publishDate = new Date(survey.publishDate);
      const endDate = new Date(publishDate);
      endDate.setDate(endDate.getDate() + survey.durationDays);
      
      if (now < publishDate) {
        toast.error('This survey is not yet active');
        navigate('/surveys');
        return;
      }
      
      if (now > endDate) {
        toast.error('This survey has ended');
        navigate('/surveys');
        return;
      }

      // Check consent status
      const consentResult = await consentApi.checkUserConsent(surveyId);
      if (consentResult.success) {
        setConsentStatus(consentResult.data);
      }

      // Fetch questions
      const questionsResult = await questionApi.getQuestions(surveyId);
      if (!questionsResult.success) {
        toast.error('Failed to fetch survey questions');
        navigate('/surveys');
        return;
      }
      
      setQuestions(questionsResult.data);

      // Start survey attempt
      const attemptResult = await responseApi.startSurveyAttempt(surveyId);
      if (attemptResult.success) {
        setAttemptId(attemptResult.data._id);
      } else {
        toast.error('Failed to start survey attempt');
      }
    } catch (error) {
      console.error('Error fetching survey data:', error);
      toast.error('An error occurred while loading the survey');
      navigate('/surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Validate current question response
    const currentQuestion = questions[activeStep];
    if (!responses[currentQuestion._id]) {
      toast.error('Please select an answer before proceeding');
      return;
    }

    // Save response
    handleSaveResponse();

    // Move to next question
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleResponseChange = (questionId, value) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };

  const handleSaveResponse = async () => {
    const currentQuestion = questions[activeStep];
    if (!currentQuestion || !responses[currentQuestion._id]) return;

    try {
      await responseApi.submitResponse(surveyId, {
        questionId: currentQuestion._id,
        selectedOption: responses[currentQuestion._id],
        attemptId: attemptId
      });
    } catch (error) {
      console.error('Error saving response:', error);
      // Continue anyway to not block the user
    }
  };

  const handleFinish = async () => {
    // Save last response if needed
    const currentQuestion = questions[activeStep];
    if (currentQuestion && responses[currentQuestion._id]) {
      await handleSaveResponse();
    }

    setSubmitting(true);
    try {
      // Complete the survey attempt
      const result = await responseApi.completeSurveyAttempt(surveyId, attemptId);
      if (result.success) {
        toast.success('Survey completed successfully');
        navigate(`/surveys/${surveyId}/complete`);
      } else {
        toast.error(result.message || 'Failed to complete survey');
      }
    } catch (error) {
      console.error('Error completing survey:', error);
      toast.error('An error occurred while completing the survey');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/surveys');
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading survey...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {survey?.name}
        </Typography>

        {consentStatus !== null && (
          <Alert 
            severity={consentStatus.hasConsent ? "info" : "warning"} 
            sx={{ mb: 3 }}
          >
            {consentStatus.hasConsent 
              ? "You have given consent for this survey. Your responses will be linked to your account."
              : "You have not given consent for this survey. Your responses will be recorded anonymously."}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ width: '100%' }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {questions.map((question, index) => (
                <Step key={question._id}>
                  <StepLabel>Question {index + 1}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Paper>

        <LinearProgress 
          variant="determinate" 
          value={(activeStep / questions.length) * 100} 
          sx={{ mb: 3, height: 8, borderRadius: 4 }}
        />

        <Paper sx={{ p: 4 }}>
          {activeStep === questions.length ? (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                All questions answered!
              </Typography>
              <Typography variant="body1" paragraph>
                You have completed all the questions. Click the button below to submit your responses.
              </Typography>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFinish}
                  disabled={submitting}
                  size="large"
                >
                  {submitting ? <CircularProgress size={24} /> : 'Submit Survey'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Question {activeStep + 1} of {questions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Parameter: {questions[activeStep].parameter}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mt: 3, mb: 4 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ mb: 2 }}>
                    <Typography variant="body1" fontWeight="500">
                      {questions[activeStep].questionText}
                    </Typography>
                  </FormLabel>
                  <RadioGroup
                    value={responses[questions[activeStep]._id] || ''}
                    onChange={(e) => handleResponseChange(questions[activeStep]._id, e.target.value)}
                  >
                    {questions[activeStep].options.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option}
                        control={<Radio />}
                        label={option}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                <Button
                  color="inherit"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<ArrowBackIcon />}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={activeStep === questions.length - 1 ? handleFinish : handleNext}
                  endIcon={activeStep === questions.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                  disabled={!responses[questions[activeStep]._id]}
                >
                  {activeStep === questions.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button variant="outlined" color="secondary" onClick={handleCancel}>
            Cancel Survey
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default SurveyAttempt;

