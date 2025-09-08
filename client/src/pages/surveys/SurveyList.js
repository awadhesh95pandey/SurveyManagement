import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { surveyApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HowToRegIcon from '@mui/icons-material/HowToReg';

const SurveyList = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const result = await surveyApi.getSurveys();
      if (result.success) {
        setSurveys(result.data);
      } else {
        toast.error('Failed to fetch surveys');
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast.error('An error occurred while fetching surveys');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateSurvey = () => {
    navigate('/surveys/create');
  };

  const handleEditSurvey = (id) => {
    navigate(`/surveys/edit/${id}`);
  };

  const handleViewSurvey = (id) => {
    navigate(`/surveys/${id}`);
  };

  const handleManageQuestions = (id) => {
    navigate(`/surveys/${id}/questions`);
  };

  const handleViewReport = (id) => {
    navigate(`/reports/surveys/${id}`);
  };

  const handleAttemptSurvey = (id) => {
    navigate(`/surveys/${id}/attempt`);
  };

  const handleManageConsent = (id) => {
    navigate(`/surveys/${id}/consent`);
  };

  const openDeleteDialog = (survey) => {
    setSurveyToDelete(survey);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSurveyToDelete(null);
  };

  const handleDeleteSurvey = async () => {
    if (!surveyToDelete) return;

    try {
      const result = await surveyApi.deleteSurvey(surveyToDelete._id);
      if (result.success) {
        toast.success('Survey deleted successfully');
        fetchSurveys();
      } else {
        toast.error(result.message || 'Failed to delete survey');
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast.error('An error occurred while deleting the survey');
    } finally {
      closeDeleteDialog();
    }
  };

  const getSurveyStatusChip = (survey) => {
    const now = new Date();
    const publishDate = new Date(survey.publishDate);
    const endDate = new Date(publishDate);
    endDate.setDate(endDate.getDate() + survey.durationDays);

    if (now < publishDate) {
      return <Chip label="Upcoming" color="info" size="small" />;
    } else if (now >= publishDate && now <= endDate) {
      return <Chip label="Active" color="success" size="small" />;
    } else {
      return <Chip label="Closed" color="default" size="small" />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Surveys
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateSurvey}
            >
              Create Survey
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Publish Date</TableCell>
                    <TableCell>Duration (Days)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {surveys
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((survey) => (
                      <TableRow hover key={survey._id}>
                        <TableCell>{survey.name}</TableCell>
                        <TableCell>{survey.department || 'All'}</TableCell>
                        <TableCell>
                          {new Date(survey.publishDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{survey.durationDays}</TableCell>
                        <TableCell>{getSurveyStatusChip(survey)}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewSurvey(survey._id)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {isAdmin && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditSurvey(survey._id)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Manage Questions">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleManageQuestions(survey._id)}
                                >
                                  <QuestionAnswerIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Manage Consent">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleManageConsent(survey._id)}
                                >
                                  <HowToRegIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="View Report">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleViewReport(survey._id)}
                                >
                                  <AssessmentIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => openDeleteDialog(survey)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          {!isAdmin && (
                            <Tooltip title="Take Survey">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleAttemptSurvey(survey._id)}
                              >
                                <QuestionAnswerIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  {surveys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No surveys found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={surveys.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Survey"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the survey "{surveyToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteSurvey} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SurveyList;

