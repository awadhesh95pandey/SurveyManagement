import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Link,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Slide,
  Avatar,
  Stack,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { questionApi, surveyApi } from '../../services/api';
import { toast } from 'react-toastify';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx';

const QuestionUpload = () => {
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState(null);
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

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

      // Fetch existing questions
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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    // Preview file contents
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate the structure
        if (jsonData.length === 0) {
          setError('The file is empty or has no valid data');
          setPreviewData([]);
          return;
        }

        // Check if the file has the required columns
        const requiredColumns = ['Sno', 'Question', 'Option 1', 'Option 2', 'Parameter'];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          setPreviewData([]);
          return;
        }

        // Validate each row
        const validatedData = [];
        const errors = [];

        jsonData.forEach((row, index) => {
          // Check if question is provided
          if (!row.Question || row.Question.trim() === '') {
            errors.push(`Row ${index + 1}: Question is required`);
            return;
          }

          // Check if at least 2 options are provided
          if (!row['Option 1'] || !row['Option 2']) {
            errors.push(`Row ${index + 1}: At least 2 options are required`);
            return;
          }

          // Check if parameter is provided
          if (!row.Parameter) {
            errors.push(`Row ${index + 1}: Parameter is required`);
            return;
          }

          validatedData.push(row);
        });

        if (errors.length > 0) {
          setError(`Validation errors:\n${errors.join('\n')}`);
        }

        setPreviewData(validatedData);
      } catch (error) {
        console.error('Error parsing file:', error);
        setError('Failed to parse the file. Please ensure it is a valid Excel or CSV file.');
        setPreviewData([]);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (error) {
      toast.error('Please fix the errors before uploading');
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await questionApi.uploadQuestions(surveyId, formData);
      if (result.success) {
        toast.success('Questions uploaded successfully');
        fetchSurveyAndQuestions();
        setFile(null);
        setPreviewData([]);
      } else {
        toast.error(result.message || 'Failed to upload questions');
      }
    } catch (error) {
      console.error('Error uploading questions:', error);
      toast.error('An error occurred while uploading questions');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadSample = async (format = 'xlsx') => {
    debugger
    try {
      await questionApi.downloadSampleTemplate(format);
      toast.success(`Sample template downloaded as ${format}`);
    } catch (error) {
      console.error('Error downloading sample template:', error);
      toast.error('Failed to download sample template');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      const result = await questionApi.deleteQuestion(questionId);
      if (result.success) {
        toast.success('Question deleted successfully');
        fetchSurveyAndQuestions();
      } else {
        toast.error(result.message || 'Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('An error occurred while deleting the question');
    }
  };

  const handleBack = () => {
    navigate(`/surveys/${surveyId}`);
  };

  const handleContinue = () => {
    navigate(`/surveys/${surveyId}/consent`);
  };

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
                Upload Questions
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
              >
                Upload questions for your survey using Excel or CSV files
              </Typography>
            </Box>
          </Box>
        </Fade>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '40vh'
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
                Loading questions...
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
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
                      <CloudUploadIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                    </Avatar>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? '1rem' : '1.25rem' 
                      }}
                    >
                      Survey: {survey?.name}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                  >
                    Upload questions for this survey using an Excel or CSV file.
                  </Typography>
                </CardContent>
              </Card>
            </Slide>

            {/* Sample Download Section */}
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
                      bgcolor: alpha(theme.palette.success.main, 0.1), 
                      width: 32, 
                      height: 32, 
                      mr: 1.5 
                    }}>
                      <DownloadIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                    </Avatar>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? '1rem' : '1.25rem' 
                      }}
                    >
                      Download Sample Templates
                    </Typography>
                  </Box>
                  
                  <Stack 
                    direction={isMobile ? "column" : "row"} 
                    spacing={2}
                    sx={{ width: isMobile ? '100%' : 'auto' }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadSample('xlsx')}
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
                      Download Sample (XLSX)
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadSample('csv')}
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
                      Download Sample (CSV)
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Slide>

            {/* Upload Section */}
            <Slide direction="up" in timeout={1400}>
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
                      <CloudUploadIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    </Avatar>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? '1rem' : '1.25rem' 
                      }}
                    >
                      Upload Questions File
                    </Typography>
                  </Box>
                  
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 2, 
                      borderRadius: 2,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      '& .MuiAlert-message': {
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }
                    }}
                  >
                    <AlertTitle sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                      File Format Requirements
                    </AlertTitle>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      <li>File must be Excel (.xlsx) or CSV format</li>
                      <li>Required columns: Sno, Question, Option 1, Option 2, Parameter</li>
                      <li>Each question must have at least 2 options (maximum 4)</li>
                      <li>Parameter is used for categorization</li>
                    </ul>
                  </Alert>

                  <Box sx={{ mt: 2, mb: 2 }}>
                    <input
                      accept=".xlsx,.csv"
                      style={{ display: 'none' }}
                      id="question-file-upload"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="question-file-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        Select File
                      </Button>
                    </label>
                    {file && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 1, 
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: theme.palette.text.secondary
                        }}
                      >
                        Selected file: {file.name}
                      </Typography>
                    )}
                  </Box>

                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        '& .MuiAlert-message': {
                          fontSize: isMobile ? '0.75rem' : '0.875rem'
                        }
                      }}
                    >
                      <AlertTitle sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
                        Error
                      </AlertTitle>
                      <pre style={{ 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        margin: 0
                      }}>
                        {error}
                      </pre>
                    </Alert>
                  )}

                  {previewData.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"} 
                        gutterBottom
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: isMobile ? '1rem' : '1.25rem' 
                        }}
                      >
                        Preview ({previewData.length} questions)
                      </Typography>
                      <TableContainer 
                        component={Paper} 
                        sx={{ 
                          maxHeight: isMobile ? 250 : 300,
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
                        <Table stickyHeader size={isMobile ? "small" : "medium"}>
                          <TableHead>
                            <TableRow>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  backgroundColor: theme.palette.grey[50]
                                }}
                              >
                                Sno
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  backgroundColor: theme.palette.grey[50]
                                }}
                              >
                                Question
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  backgroundColor: theme.palette.grey[50]
                                }}
                              >
                                Option 1
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  backgroundColor: theme.palette.grey[50]
                                }}
                              >
                                Option 2
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  backgroundColor: theme.palette.grey[50]
                                }}
                              >
                                Option 3
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  backgroundColor: theme.palette.grey[50]
                                }}
                              >
                                Option 4
                              </TableCell>
                              <TableCell 
                                sx={{ 
                                  fontWeight: 600, 
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                                  backgroundColor: theme.palette.grey[50]
                                }}
                              >
                                Parameter
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {previewData.map((row, index) => (
                              <TableRow 
                                key={index}
                                sx={{ 
                                  '&:hover': { 
                                    backgroundColor: theme.palette.action.hover 
                                  }
                                }}
                              >
                                <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                  {row.Sno}
                                </TableCell>
                                <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                  {row.Question}
                                </TableCell>
                                <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                  {row['Option 1']}
                                </TableCell>
                                <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                  {row['Option 2']}
                                </TableCell>
                                <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                  {row['Option 3'] || '-'}
                                </TableCell>
                                <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                  {row['Option 4'] || '-'}
                                </TableCell>
                                <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                  {row.Parameter}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleUpload}
                          disabled={uploadLoading || error !== null}
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                            boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.2)}`,
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            '&:hover': {
                              background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                            },
                            transition: 'all 0.2s ease-in-out',
                            '&:disabled': {
                              background: theme.palette.action.disabledBackground,
                              color: theme.palette.action.disabled,
                              transform: 'none',
                              boxShadow: 'none'
                            }
                          }}
                        >
                          {uploadLoading ? <CircularProgress size={isMobile ? 16 : 20} /> : 'Upload Questions'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Slide>

            {/* Existing Questions Section */}
            {questions.length > 0 && (
              <Slide direction="up" in timeout={1600}>
                <Card sx={{ 
                  mb: 2, 
                  borderRadius: 2,
                  boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.warning.main, 0.1), 
                        width: 32, 
                        height: 32, 
                        mr: 1.5 
                      }}>
                        <DeleteIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                      </Avatar>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"} 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: isMobile ? '1rem' : '1.25rem' 
                        }}
                      >
                        Existing Questions ({questions.length})
                      </Typography>
                    </Box>
                    
                    <TableContainer 
                      component={Paper} 
                      sx={{ 
                        maxHeight: isMobile ? 300 : 400,
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
                      <Table stickyHeader size={isMobile ? "small" : "medium"}>
                        <TableHead>
                          <TableRow>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Question
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Options
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Parameter
                            </TableCell>
                            <TableCell 
                              align="center"
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Actions
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {questions.map((question) => (
                            <TableRow 
                              key={question._id}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: theme.palette.action.hover 
                                }
                              }}
                            >
                              <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {question.questionText}
                              </TableCell>
                              <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                <ol style={{ margin: 0, paddingLeft: 16 }}>
                                  {question.options.map((option, index) => (
                                    <li key={index}>{option}</li>
                                  ))}
                                </ol>
                              </TableCell>
                              <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {question.parameter}
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteQuestion(question._id)}
                                    sx={{
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                                        transform: 'scale(1.1)',
                                      },
                                      transition: 'all 0.2s ease-in-out',
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Slide>
            )}

            {/* Action Buttons */}
            <Slide direction="up" in timeout={1800}>
              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 2 : 0
              }}>
                <Button 
                  variant="outlined" 
                  onClick={handleBack}
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
                  Back to Survey
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleContinue}
                  disabled={questions.length === 0}
                  size={isMobile ? "small" : "medium"}
                  fullWidth={isMobile}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    },
                    transition: 'all 0.2s ease-in-out',
                    '&:disabled': {
                      background: theme.palette.action.disabledBackground,
                      color: theme.palette.action.disabled,
                      transform: 'none',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Continue to Consent Management
                </Button>
              </Box>
            </Slide>
          </>
        )}
      </Container>
    </Box>
  );
};

export default QuestionUpload;

