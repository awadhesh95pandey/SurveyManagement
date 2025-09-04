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
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { surveyApi, employeeApi, departmentApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const SurveyCreate = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const navigate = useNavigate();

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
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Survey
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
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
                />
              </Grid>

              <Grid item xs={12} sm={6}>
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
                      />
                    )}
                    disablePast
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6}>
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
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl 
                  fullWidth
                  error={formik.touched.department && Boolean(formik.errors.department)}
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
                      // Reset employees when department changes
                      formik.setFieldValue('targetEmployees', []);
                    }}
                    onBlur={formik.handleBlur}
                    disabled={loadingDepartments}
                  >
                    {loadingDepartments ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading departments...
                      </MenuItem>
                    ) : (
                      [
                        <MenuItem key="all" value="All Departments">
                          All Departments
                        </MenuItem>,
                        ...departments.map((dept) => (
                          <MenuItem key={dept._id} value={dept.name}>
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

              {formik.values.department && (
                <Grid item xs={12}>
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
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingEmployees ? <CircularProgress color="inherit" size={20} /> : null}
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

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Create Survey'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SurveyCreate;
