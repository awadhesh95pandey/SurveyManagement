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
  Link
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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Upload Questions
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Survey: {survey?.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Upload questions for this survey using an Excel or CSV file.
              </Typography>

              <Box sx={{ mt: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadSample('xlsx')}
                    >
                      Download Sample (XLSX)
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownloadSample('csv')}
                    >
                      Download Sample (CSV)
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Upload Questions File
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>File Format Requirements</AlertTitle>
                  <ul>
                    <li>File must be Excel (.xlsx) or CSV format</li>
                    <li>Required columns: Sno, Question, Option 1, Option 2, Parameter</li>
                    <li>Each question must have at least 2 options (maximum 4)</li>
                    <li>Parameter is used for categorization</li>
                  </ul>
                </Alert>

                <Box sx={{ mt: 2, mb: 3 }}>
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
                    >
                      Select File
                    </Button>
                  </label>
                  {file && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Selected file: {file.name}
                    </Typography>
                  )}
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    <AlertTitle>Error</AlertTitle>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {error}
                    </pre>
                  </Alert>
                )}

                {previewData.length > 0 && (
                  <Box sx={{ mt: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Preview ({previewData.length} questions)
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Sno</TableCell>
                            <TableCell>Question</TableCell>
                            <TableCell>Option 1</TableCell>
                            <TableCell>Option 2</TableCell>
                            <TableCell>Option 3</TableCell>
                            <TableCell>Option 4</TableCell>
                            <TableCell>Parameter</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewData.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.Sno}</TableCell>
                              <TableCell>{row.Question}</TableCell>
                              <TableCell>{row['Option 1']}</TableCell>
                              <TableCell>{row['Option 2']}</TableCell>
                              <TableCell>{row['Option 3'] || '-'}</TableCell>
                              <TableCell>{row['Option 4'] || '-'}</TableCell>
                              <TableCell>{row.Parameter}</TableCell>
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
                      >
                        {uploadLoading ? <CircularProgress size={24} /> : 'Upload Questions'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>

            {questions.length > 0 && (
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Existing Questions ({questions.length})
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Question</TableCell>
                        <TableCell>Options</TableCell>
                        <TableCell>Parameter</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {questions.map((question) => (
                        <TableRow key={question._id}>
                          <TableCell>{question.questionText}</TableCell>
                          <TableCell>
                            <ol>
                              {question.options.map((option, index) => (
                                <li key={index}>{option}</li>
                              ))}
                            </ol>
                          </TableCell>
                          <TableCell>{question.parameter}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteQuestion(question._id)}
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
              </Paper>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={handleBack}>
                Back to Survey
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleContinue}
                disabled={questions.length === 0}
              >
                Continue to Consent Management
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default QuestionUpload;

