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
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardContent,
  alpha,
  useTheme,
  Fade,
  Slide,
  Avatar,
  Chip
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { questionApi, surveyApi } from '../../services/api';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QuizIcon from '@mui/icons-material/Quiz';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    fetchSurveyAndQuestions();
  }, [surveyId]);

  const fetchSurveyAndQuestions = async () => {
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

      // Fetch questions
      const questionsResult = await questionApi.getQuestions(surveyId);
      if (questionsResult.success) {
        setQuestions(questionsResult.data);
      } else {
        toast.error('Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadQuestions = () => {
    navigate(`/surveys/${surveyId}/questions/upload`);
  };

  const handleEditQuestion = (questionId) => {
    // Navigate to question edit page (to be implemented)
    toast.info('Question editing feature coming soon');
  };

  const openDeleteDialog = (question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      const result = await questionApi.deleteQuestion(questionToDelete._id);
      if (result.success) {
        toast.success('Question deleted successfully');
        fetchSurveyAndQuestions();
      } else {
        toast.error(result.message || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('An error occurred while deleting the question');
    } finally {
      closeDeleteDialog();
    }
  };

  const handleBack = () => {
    navigate(`/surveys/${surveyId}`);
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
        <CircularProgress size={32} />
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
      <Container maxWidth={false} sx={{ position: 'relative', zIndex: 1, py: 2 }}>
        {/* Header Section */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Tooltip title="Back to Survey" arrow>
                <IconButton
                  onClick={handleBack}
                  sx={{
                    mr: 1,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
                Survey Questions
              </Typography>
            </Box>
          </Box>
        </Fade>

        {/* Survey Info Card */}
        <Slide direction="up" in timeout={1000}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            mb: 2
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1), 
                  width: 28, 
                  height: 28, 
                  mr: 1 
                }}>
                  <AssessmentIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                </Avatar>
                <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Survey Information
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500, mb: 0.5 }}>
                {survey?.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={`${questions.length} Questions`}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleUploadQuestions}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    },
                    transition: 'all 0.2s ease-in-out',
                    fontSize: '0.8rem',
                    px: 2,
                    py: 1
                  }}
                >
                  Upload Questions
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Slide>

        {/* Questions Table */}
        {questions.length > 0 ? (
          <Slide direction="up" in timeout={1200}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
            }}>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader aria-label="questions table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>S.No</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Question</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Options</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Parameter</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {questions.map((question, index) => (
                      <Fade in timeout={1400 + index * 100} key={question._id}>
                        <TableRow 
                          hover 
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: alpha(theme.palette.primary.main, 0.02) 
                            },
                            '&:last-child td, &:last-child th': { border: 0 }
                          }}
                        >
                          <TableCell sx={{ fontSize: '0.8rem', py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                width: 24, 
                                height: 24, 
                                mr: 1,
                                fontSize: '0.7rem'
                              }}>
                                {index + 1}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                {index + 1}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', py: 1.5, maxWidth: 300 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                              {question.questionText}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', py: 1.5, maxWidth: 250 }}>
                            <Box>
                              {question.options.map((option, optIndex) => (
                                <Typography key={optIndex} variant="body2" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  {optIndex + 1}. {option}
                                </Typography>
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', py: 1.5 }}>
                            <Chip 
                              label={question.parameter}
                              size="small"
                              sx={{ 
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                color: theme.palette.secondary.main,
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditQuestion(question._id)}
                                  sx={{ 
                                    color: theme.palette.primary.main,
                                    width: 28,
                                    height: 28,
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => openDeleteDialog(question)}
                                  sx={{ 
                                    color: theme.palette.error.main,
                                    width: 28,
                                    height: 28,
                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      </Fade>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Slide>
        ) : (
          <Slide direction="up" in timeout={1200}>
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              textAlign: 'center',
              p: 3
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1), 
                  width: 48, 
                  height: 48, 
                  mx: 'auto',
                  mb: 2
                }}>
                  <QuestionAnswerIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 1 }}>
                  No Questions Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 2 }}>
                  This survey doesn't have any questions yet. Upload questions to get started.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CloudUploadIcon />}
                  onClick={handleUploadQuestions}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    },
                    transition: 'all 0.2s ease-in-out',
                    fontSize: '0.8rem',
                    px: 2,
                    py: 1
                  }}
                >
                  Upload Questions
                </Button>
              </Box>
            </Card>
          </Slide>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={closeDeleteDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }
          }}
        >
          <DialogTitle id="alert-dialog-title" sx={{ fontSize: '1.1rem', fontWeight: 600, pb: 1 }}>
            Delete Question
          </DialogTitle>
          <DialogContent sx={{ pb: 2 }}>
            <DialogContentText id="alert-dialog-description" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button 
              onClick={closeDeleteDialog}
              size="small"
              sx={{ fontSize: '0.8rem' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteQuestion} 
              color="error" 
              autoFocus
              size="small"
              sx={{ fontSize: '0.8rem' }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default QuestionList;

