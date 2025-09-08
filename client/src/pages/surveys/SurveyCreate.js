import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Divider,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  alpha,
  useTheme,
  Fade,
  Slide,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { surveyApi, employeeApi, departmentApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreateIcon from '@mui/icons-material/Create';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';

const SurveyCreate = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Survey name is required')
      .min(3, 'Survey name must be at least 3 characters'),
    publishDate: Yup.date()
      .required('Publish date is required')
      .min(new Date(), 'Publish date must be in the future'),
    durationDays: Yup.number()
      .required('Duration is required')
      .positive('Duration must be positive')
      .integer('Duration must be a whole number'),
    department: Yup.string()
      .required('Department is required'),
    targetEmployees: Yup.array()
      .when('department', {
        is: 'All Departments',
        then: (schema) => schema,
        otherwise: (schema) => schema.min(1, 'Select at least one employee')
      })
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      name: '',
      publishDate: null,
      durationDays: 7,
      department: '',
      targetEmployees: []
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      debugger
      setLoading(true);
      try {
        // Format the data for API
        const surveyData = {
          ...values,
          publishDate: values.publishDate ? values.publishDate.toISOString() : null,
          targetEmployees: values.targetEmployees.map(emp => emp.id)
        };

        const result = await surveyApi.createSurvey(surveyData);
        if (result.success) {
          toast.success('Survey created successfully');
          navigate(`/surveys/${result.data._id}/questions/upload`);
        } else {
          toast.error(result.message || 'Failed to create survey');
        }
      } catch (error) {
        console.error('Error creating survey:', error);
        toast.error('An error occurred while creating the survey');
      } finally {
        setLoading(false);
      }
    }
  });

  // Fetch departments function
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const result = await departmentApi.getDepartments();
      if (result.success) {
        setDepartments(result.data);
      } else {
        toast.error(result.message || 'Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Fetch employees function
  const fetchEmployees = async (department = null) => {
    setLoadingEmployees(true);
    try {
      const params = department && department !== 'All Departments' ? { department } : {};
      const result = await employeeApi.getEmployees(params);
      if (result.success) {
        const employeeData = result.data.map(emp => ({
          id: emp._id,
          name: emp.name,
          email: emp.email,
          department: emp.department?.name || 'No Department',
          role: emp.role
        }));
        setEmployees(employeeData);
        setFilteredEmployees(employeeData);
      } else {
        toast.error(result.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch employees when department changes
  useEffect(() => {
    if (formik.values.department && formik.values.department !== 'All Departments') {
      fetchEmployees(formik.values.department);
    } else if (formik.values.department === 'All Departments') {
      fetchEmployees();
    }
  }, [formik.values.department]);

  const handleCancel = () => {
    navigate('/surveys');
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Tooltip title="Back to Surveys" arrow>
                <IconButton
                  onClick={handleCancel}
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
                Create New Survey
              </Typography>
            </Box>
          </Box>
        </Fade>

        {/* Form Card */}
        <Slide direction="up" in timeout={1000}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box component="form" onSubmit={formik.handleSubmit} noValidate>
                <Grid container spacing={2}>
                  {/* Survey Name */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        width: 28, 
                        height: 28, 
                        mr: 1 
                      }}>
                        <CreateIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        Survey Details
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label="Survey Name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white !important',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.9rem',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.9rem',
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: '0.75rem',
                        },
                      }}
                    />
                  </Grid>

                  {/* Date and Duration */}
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        width: 28, 
                        height: 28, 
                        mr: 1 
                      }}>
                        <CalendarTodayIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        Publish Date
                      </Typography>
                    </Box>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Publish Date"
                        value={formik.values.publishDate}
                        onChange={(newValue) => {
                          formik.setFieldValue('publishDate', newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            id="publishDate"
                            name="publishDate"
                            error={formik.touched.publishDate && Boolean(formik.errors.publishDate)}
                            helperText={formik.touched.publishDate && formik.errors.publishDate}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'white !important',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '0.9rem',
                              },
                              '& .MuiInputLabel-root': {
                                fontSize: '0.9rem',
                              },
                              '& .MuiFormHelperText-root': {
                                fontSize: '0.75rem',
                              },
                            }}
                          />
                        )}
                        disablePast
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        width: 28, 
                        height: 28, 
                        mr: 1 
                      }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        Duration
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      id="durationDays"
                      name="durationDays"
                      label="Duration (Days)"
                      type="number"
                      value={formik.values.durationDays}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.durationDays && Boolean(formik.errors.durationDays)}
                      helperText={formik.touched.durationDays && formik.errors.durationDays}
                      InputProps={{ inputProps: { min: 1 } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white !important',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.9rem',
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.9rem',
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: '0.75rem',
                        },
                      }}
                    />
                  </Grid>

                  {/* Department Selection */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        width: 28, 
                        height: 28, 
                        mr: 1 
                      }}>
                        <BusinessIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        Target Department
                      </Typography>
                    </Box>
                    <FormControl 
                      fullWidth
                      error={formik.touched.department && Boolean(formik.errors.department)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white !important',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '0.9rem',
                        },
                        '& .MuiFormHelperText-root': {
                          fontSize: '0.75rem',
                        },
                      }}
                    >
                      <InputLabel id="department-label">Target Department</InputLabel>
                      <Select
                        labelId="department-label"
                        id="department"
                        name="department"
                        value={formik.values.department}
                        label="Target Department"
                        onChange={(e) => {
                          formik.setFieldValue('department', e.target.value);
                          formik.setFieldValue('targetEmployees', []);
                        }}
                        onBlur={formik.handleBlur}
                        disabled={loadingDepartments}
                        sx={{
                          '& .MuiSelect-select': {
                            fontSize: '0.9rem',
                          },
                        }}
                      >
                        {loadingDepartments ? (
                          <MenuItem disabled>
                            <CircularProgress size={16} sx={{ mr: 1 }} />
                            <Typography sx={{ fontSize: '0.8rem' }}>Loading departments...</Typography>
                          </MenuItem>
                        ) : (
                          [
                            <MenuItem key="all" value="All Departments" sx={{ fontSize: '0.9rem' }}>
                              All Departments
                            </MenuItem>,
                            ...departments.map((dept) => (
                              <MenuItem key={dept._id} value={dept.name} sx={{ fontSize: '0.9rem' }}>
                                {dept.name}
                              </MenuItem>
                            ))
                          ]
                        )}
                      </Select>
                      {formik.touched.department && formik.errors.department && (
                        <FormHelperText>{formik.errors.department}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Employee Selection */}
                  {formik.values.department && (
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          width: 28, 
                          height: 28, 
                          mr: 1 
                        }}>
                          <PeopleIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                          Target Employees
                        </Typography>
                      </Box>
                      <Autocomplete
                        multiple
                        id="targetEmployees"
                        options={filteredEmployees}
                        getOptionLabel={(option) => `${option.name} (${option.email}) - ${option.department}`}
                        value={formik.values.targetEmployees}
                        onChange={(event, newValue) => {
                          formik.setFieldValue('targetEmployees', newValue);
                        }}
                        loading={loadingEmployees}
                        disabled={loadingEmployees}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={`${option.name} - ${option.department}`}
                              {...getTagProps({ index })}
                              key={option.id}
                              size="small"
                              sx={{ fontSize: '0.75rem', height: 24 }}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Target Employees"
                            placeholder={loadingEmployees ? "Loading employees..." : "Select employees for the survey"}
                            error={formik.touched.targetEmployees && Boolean(formik.errors.targetEmployees)}
                            helperText={formik.touched.targetEmployees && formik.errors.targetEmployees}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'white !important',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '0.9rem',
                              },
                              '& .MuiInputLabel-root': {
                                fontSize: '0.9rem',
                              },
                              '& .MuiFormHelperText-root': {
                                fontSize: '0.75rem',
                              },
                            }}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingEmployees ? <CircularProgress color="inherit" size={16} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                    size="small"
                    sx={{ 
                      fontSize: '0.8rem',
                      px: 2,
                      py: 1,
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    size="small"
                    startIcon={loading ? <CircularProgress size={16} /> : <CreateIcon />}
                    sx={{ 
                      fontSize: '0.8rem',
                      px: 2,
                      py: 1,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Survey'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Slide>
      </Container>
    </Box>
  );
};

export default SurveyCreate;
