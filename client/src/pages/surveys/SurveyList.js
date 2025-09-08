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
  DialogTitle,
  Card,
  CardContent,
  alpha,
  useTheme,
  Fade,
  Slide,
  Avatar
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
  const theme = useTheme();
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
      <Container maxWidth={false} sx={{ position: 'relative', zIndex: 1, py: 2, width: '100%' }}>
        {/* Header Section */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
                Surveys
              </Typography>
              {isAdmin && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleCreateSurvey}
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
                  Create Survey
                </Button>
              )}
            </Box>
          </Box>
        </Fade>

        {/* Surveys Table */}
        <Slide direction="up" in timeout={1000}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader aria-label="surveys table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Name</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Department</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Publish Date</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Duration</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Status</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 600, py: 1.5 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {surveys
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((survey, index) => (
                          <Fade in timeout={1200 + index * 100} key={survey._id}>
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
                                    {survey.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                    {survey.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', py: 1.5 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                  {survey.department || 'All'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', py: 1.5 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                  {new Date(survey.publishDate).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    timeZone: 'Asia/Kolkata'
                                  })}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', py: 1.5 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                  {survey.durationDays} days
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', py: 1.5 }}>
                                {getSurveyStatusChip(survey)}
                              </TableCell>
                              <TableCell align="center" sx={{ py: 1.5 }}>
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                  <Tooltip title="View">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewSurvey(survey._id)}
                                      sx={{ 
                                        color: theme.palette.primary.main,
                                        width: 28,
                                        height: 28,
                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                      }}
                                    >
                                      <VisibilityIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>

                                  {isAdmin && (
                                    <>
                                      <Tooltip title="Edit">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleEditSurvey(survey._id)}
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

                                      <Tooltip title="Questions">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleManageQuestions(survey._id)}
                                          sx={{ 
                                            color: theme.palette.primary.main,
                                            width: 28,
                                            height: 28,
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                          }}
                                        >
                                          <QuestionAnswerIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </Tooltip>

                                      <Tooltip title="Consent">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleManageConsent(survey._id)}
                                          sx={{ 
                                            color: theme.palette.primary.main,
                                            width: 28,
                                            height: 28,
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                          }}
                                        >
                                          <HowToRegIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </Tooltip>

                                      <Tooltip title="Report">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleViewReport(survey._id)}
                                          sx={{ 
                                            color: theme.palette.primary.main,
                                            width: 28,
                                            height: 28,
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                          }}
                                        >
                                          <AssessmentIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                      </Tooltip>

                                      <Tooltip title="Delete">
                                        <IconButton
                                          size="small"
                                          onClick={() => openDeleteDialog(survey)}
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
                                    </>
                                  )}

                                  {!isAdmin && (
                                    <Tooltip title="Take Survey">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleAttemptSurvey(survey._id)}
                                        sx={{ 
                                          color: theme.palette.success.main,
                                          width: 28,
                                          height: 28,
                                          '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.08) }
                                        }}
                                      >
                                        <QuestionAnswerIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        ))}
                      {surveys.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                No surveys found
                              </Typography>
                            </Box>
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
                  sx={{
                    '& .MuiTablePagination-toolbar': {
                      minHeight: 48,
                      fontSize: '0.8rem'
                    },
                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                      fontSize: '0.8rem'
                    }
                  }}
                />
              </>
            )}
          </Card>
        </Slide>
      </Container>

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
          Delete Survey
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText id="alert-dialog-description" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
            Are you sure you want to delete the survey "{surveyToDelete?.name}"? This action cannot be undone.
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
            onClick={handleDeleteSurvey} 
            color="error" 
            autoFocus
            size="small"
            sx={{ fontSize: '0.8rem' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SurveyList;

