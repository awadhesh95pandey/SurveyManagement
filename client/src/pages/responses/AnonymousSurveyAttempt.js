import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  LinearProgress,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyApi, responseApi } from '../../services/api';
import { toast } from 'react-toastify';

const AnonymousSurveyAttempt = () => {
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurveyByToken();
  }, [token]);

  const fetchSurveyByToken = async () => {
    setLoading(true);
    try {
      const result = await surveyApi.getSurveyByToken(token);
      if (result.success) {
        setSurvey(result.data.survey);
        setQuestions(result.data.questions);
        
        // Check if survey is still active
        const now = new Date();
        const publishDate = new Date(result.data.survey.publishDate);
        const endDate = new Date(publishDate);
        endDate.setDate(endDate.getDate() + result.data.survey.noOfDays);

        if (now < publishDate) {
          setError('This survey is not yet available. Please check back on the publish date.');
        } else if (now > endDate) {
          setError('This survey has expired and is no longer accepting responses.');
        }
      } else {
        // Handle specific token validation errors
        if (result.status === 'used') {
          setError('This survey has already been completed. Each employee can only submit one response per survey.');
        } else if (result.status === 'expired') {
          setError('This survey link has expired. Please contact your administrator for a new link.');
        } else {
          setError(result.message || 'Survey not found or invalid token');
        }
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.status === 'used') {
          setError('This survey has already been completed. Each employee can only submit one response per survey.');
        } else if (errorData.status === 'expired') {
          setError('This survey link has expired. Please contact your administrator for a new link.');
        } else {
          setError(errorData.message || 'Survey not available');
        }
      } else {
        setError('An error occurred while loading the survey');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => !responses[q._id]);
    if (unansweredQuestions.length > 0) {
      toast.error(`Please answer all questions. ${unansweredQuestions.length} questions remaining.`);
      return;
    }

    setSubmitting(true);
    try {
      // Format responses for token-based API
      const formattedResponses = questions.map(question => ({
        questionId: question._id,
        answer: responses[question._id]
      }));

      const result = await responseApi.submitTokenBasedResponse(token, {
        responses: formattedResponses
      });

      if (result.success) {
        setSurveyCompleted(true);
        toast.success('Survey submitted successfully! Thank you for your participation.');
      } else {
        toast.error(result.message || 'Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('An error occurred while submitting the survey');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = () => {
    const answeredQuestions = Object.keys(responses).length;
    return (answeredQuestions / questions.length) * 100;
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={() => window.close()}>
            Close
          </Button>
        </Box>
      </Container>
    );
  }

  if (surveyCompleted) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom color="success.main">
              Survey Completed Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you for taking the time to complete this survey. Your responses have been recorded anonymously.
            </Typography>
            <Button variant="contained" onClick={() => window.close()}>
              Close Window
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (!survey || questions.length === 0) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning">
            No questions found for this survey.
          </Alert>
        </Box>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Survey Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {survey.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please answer all questions honestly. Your responses are anonymous.
          </Typography>
          
          {/* Progress Bar */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Progress: {Object.keys(responses).length} of {questions.length} questions answered
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={getProgress()} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Paper>

        {/* Question Stepper */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stepper activeStep={currentQuestionIndex} alternativeLabel>
            {questions.map((_, index) => (
              <Step key={index}>
                <StepLabel>
                  Question {index + 1}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Current Question */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Question {currentQuestionIndex + 1} of {questions.length}
              </Typography>
              
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'medium' }}>
                  {currentQuestion.questionText}
                </FormLabel>
                
                <RadioGroup
                  value={responses[currentQuestion._id] || ''}
                  onChange={(e) => handleResponseChange(currentQuestion._id, e.target.value)}
                >
                  {currentQuestion.options.map((option, index) => (
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

              {currentQuestion.parameter && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Category: {currentQuestion.parameter}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Paper>

        {/* Navigation Buttons */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={handlePrevious}
              disabled={isFirstQuestion}
            >
              Previous
            </Button>

            <Typography variant="body2" color="text.secondary">
              {currentQuestionIndex + 1} / {questions.length}
            </Typography>

            {isLastQuestion ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting || !responses[currentQuestion._id]}
              >
                {submitting ? <CircularProgress size={24} /> : 'Submit Survey'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!responses[currentQuestion._id]}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AnonymousSurveyAttempt;
