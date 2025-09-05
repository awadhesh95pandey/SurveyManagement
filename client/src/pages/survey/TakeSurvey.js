import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { surveyApi, questionApi, responseApi } from '../../services/api';

const TakeSurvey = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attemptId, setAttemptId] = useState(null);

  useEffect(() => {
    fetchSurveyData();
  }, [id]);

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      
      // Get survey details using public route
      const surveyResult = await fetch(`/api/surveys/${id}/take`);
      if (!surveyResult.ok) {
        setError('Failed to load survey details');
        return;
      }
      const surveyData = await surveyResult.json();
      setSurvey(surveyData.data);
      
      // Get survey questions using public route
      const questionsResult = await fetch(`/api/surveys/${id}/questions/public`);
      if (!questionsResult.ok) {
        setError('Failed to load survey questions');
        return;
      }
      const questionsData = await questionsResult.json();
      
      setQuestions(questionsData.data);
      
      // Initialize responses object
      const initialResponses = {};
      questionsData.data.forEach(question => {
        if (question.type === 'multiple_choice' && question.allowMultiple) {
          initialResponses[question._id] = [];
        } else {
          initialResponses[question._id] = '';
        }
      });
      setResponses(initialResponses);
      
      // Start survey attempt using public route
      const attemptResponse = await fetch(`/api/surveys/${id}/responses/public/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (attemptResponse.ok) {
        const attemptData = await attemptResponse.json();
        setAttemptId(attemptData.data.attemptId);
      }
      
    } catch (err) {
      setError('Failed to load survey data');
      console.error('Error fetching survey data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, value, questionType) => {
    setResponses(prev => {
      if (questionType === 'multiple_choice' && Array.isArray(prev[questionId])) {
        // Handle multiple choice with multiple selections
        const currentSelections = prev[questionId];
        if (currentSelections.includes(value)) {
          return {
            ...prev,
            [questionId]: currentSelections.filter(item => item !== value)
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentSelections, value]
          };
        }
      } else {
        // Handle single selection or text input
        return {
          ...prev,
          [questionId]: value
        };
      }
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Validate all questions are answered
      const unansweredQuestions = questions.filter(question => {
        const response = responses[question._id];
        if (question.required) {
          if (Array.isArray(response)) {
            return response.length === 0;
          }
          return !response || response.trim() === '';
        }
        return false;
      });

      if (unansweredQuestions.length > 0) {
        setError(`Please answer all required questions: ${unansweredQuestions.map(q => q.text).join(', ')}`);
        return;
      }

      // Format responses for submission
      const formattedResponses = questions.map(question => ({
        questionId: question._id,
        answer: responses[question._id],
        questionType: question.type
      }));

      // Submit responses using public route
      const submitResponse = await fetch(`/api/surveys/${id}/responses/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attemptId,
          responses: formattedResponses
        })
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        setError(errorData.message || 'Failed to submit responses');
        return;
      }

      // Complete the attempt using public route
      if (attemptId) {
        await fetch(`/api/surveys/${id}/responses/public/attempt/${attemptId}/complete`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      setSuccess('Survey submitted successfully! Thank you for your participation.');
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      setError('Failed to submit survey. Please try again.');
      console.error('Error submitting survey:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const response = responses[question._id];

    switch (question.type) {
      case 'multiple_choice':
        if (question.allowMultiple) {
          return (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                {question.text}
                {question.required && <span style={{ color: 'red' }}> *</span>}
              </FormLabel>
              <FormGroup>
                {question.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={response.includes(option)}
                        onChange={(e) => handleResponseChange(question._id, option, question.type)}
                      />
                    }
                    label={option}
                  />
                ))}
              </FormGroup>
            </FormControl>
          );
        } else {
          return (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                {question.text}
                {question.required && <span style={{ color: 'red' }}> *</span>}
              </FormLabel>
              <RadioGroup
                value={response}
                onChange={(e) => handleResponseChange(question._id, e.target.value, question.type)}
              >
                {question.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          );
        }

      case 'text':
        return (
          <FormControl fullWidth>
            <TextField
              label={question.text + (question.required ? ' *' : '')}
              multiline
              rows={4}
              value={response}
              onChange={(e) => handleResponseChange(question._id, e.target.value, question.type)}
              variant="outlined"
              fullWidth
            />
          </FormControl>
        );

      case 'rating':
        return (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
              {question.text}
              {question.required && <span style={{ color: 'red' }}> *</span>}
            </FormLabel>
            <RadioGroup
              row
              value={response}
              onChange={(e) => handleResponseChange(question._id, e.target.value, question.type)}
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <FormControlLabel
                  key={rating}
                  value={rating.toString()}
                  control={<Radio />}
                  label={rating.toString()}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      default:
        return (
          <TextField
            label={question.text + (question.required ? ' *' : '')}
            value={response}
            onChange={(e) => handleResponseChange(question._id, e.target.value, question.type)}
            variant="outlined"
            fullWidth
          />
        );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !survey) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
          <Typography variant="h5" gutterBottom>
            Thank You!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your responses have been recorded. You will be redirected to the dashboard shortly.
          </Typography>
        </Paper>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Survey Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {survey?.name}
          </Typography>
          {survey?.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {survey.description}
            </Typography>
          )}
          <Divider sx={{ my: 2 }} />
        </Box>

        {/* Progress Indicator */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
            <Box
              sx={{
                width: `${progress}%`,
                bgcolor: 'primary.main',
                height: 8,
                borderRadius: 1,
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Box>

        {/* Current Question */}
        {currentQuestion && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              {renderQuestion(currentQuestion)}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : null}
              >
                {submitting ? 'Submitting...' : 'Submit Survey'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Survey Info */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Survey ID: {survey?._id} | 
            Due Date: {survey?.endDate ? new Date(survey.endDate).toLocaleDateString() : 'No due date'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TakeSurvey;
