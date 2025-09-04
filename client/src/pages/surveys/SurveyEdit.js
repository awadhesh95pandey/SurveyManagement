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
import { useNavigate, useParams } from 'react-router-dom';
import { surveyApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Mock data for departments and employees
const departments = [
  'Human Resources',
  'Finance',
  'Information Technology',
  'Marketing',
  'Operations',
  'Sales',
  'Research & Development',
  'Customer Support',
  'All Departments'
];

const employees = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', department: 'Human Resources' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', department: 'Finance' },
  { id: '3', name: 'Robert Johnson', email: 'robert.johnson@example.com', department: 'Information Technology' },
  { id: '4', name: 'Emily Davis', email: 'emily.davis@example.com', department: 'Marketing' },
  { id: '5', name: 'Michael Wilson', email: 'michael.wilson@example.com', department: 'Operations' }
];

const SurveyEdit = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Survey name is required')
      .min(3, 'Survey name must be at least 3 characters'),
    publishDate: Yup.date()
      .required('Publish Date is required'),
    noOfDays: Yup.number()
      .required('Duration is required')
      .positive('Duration must be positive')
      .integer('Duration must be a whole number'),
    department: Yup.string()
      .required('Department is required'),
    employees: Yup.array()
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
      noOfDays: 7,
      department: '',
      employees: []
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        // Format the data for API
        const surveyData = {
          ...values,
          publishDate: values.publishDate ? new Date(values.publishDate).toISOString() : null,
          employees: values.employees.map(emp => emp.id)
        };

        const result = await surveyApi.updateSurvey(id, surveyData);
        if (result.success) {
          toast.success('Survey updated successfully');
          navigate(`/surveys/${id}`);
        } else {
          toast.error(result.message || 'Failed to update survey');
        }
      } catch (error) {
        console.error('Error updating survey:', error);
        toast.error('An error occurred while updating the survey');
      } finally {
        setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    setLoading(true);
    try {
      const result = await surveyApi.getSurvey(id);
      if (result.success) {
        const surveyData = result.data;
        setSurvey(surveyData);
        
        // Populate form with existing data
        formik.setValues({
          name: surveyData.name || '',
          publishDate: surveyData.publishDate ? new Date(surveyData.publishDate).toISOString().split('T')[0] : null,
          noOfDays: surveyData.noOfDays || 7,
          department: surveyData.department || '',
          employees: surveyData.employees || []
        });
      } else {
        toast.error('Failed to fetch survey details');
        navigate('/surveys');
      }
    } catch (error) {
      console.error('Error fetching survey:', error);
      toast.error('An error occurred while fetching survey details');
      navigate('/surveys');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on selected department
  const filteredEmployees = formik.values.department === 'All Departments'
    ? employees
    : employees.filter(emp => emp.department === formik.values.department);

  const handleCancel = () => {
    navigate(`/surveys/${id}`);
  };

  const handleDateChange = (date) => {
    formik.setFieldValue('publishDate', date);
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

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Survey
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
                <TextField
                  fullWidth
                  id="publishDate"
                  name="publishDate"
                  label="Publish Date"
                  type="date"
                  value={formik.values.publishDate || ''}
                  onChange={(e) => {
                    const date = e.target.value;
                    handleDateChange(date);
                  }}
                  onBlur={formik.handleBlur}
                  error={formik.touched.publishDate && Boolean(formik.errors.publishDate)}
                  helperText={formik.touched.publishDate && formik.errors.publishDate}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="noOfDays"
                  name="noOfDays"
                  label="Duration (Days)"
                  type="number"
                  value={formik.values.noOfDays}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.noOfDays && Boolean(formik.errors.noOfDays)}
                  helperText={formik.touched.noOfDays && formik.errors.noOfDays}
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
                      formik.setFieldValue('employees', []);
                    }}
                    onBlur={formik.handleBlur}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.department && formik.errors.department && (
                    <FormHelperText>{formik.errors.department}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {formik.values.department && formik.values.department !== 'All Departments' && (
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    id="employees"
                    options={filteredEmployees}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={formik.values.employees}
                    onChange={(event, newValue) => {
                      formik.setFieldValue('employees', newValue);
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Target Employees"
                        placeholder="Select employees"
                        error={formik.touched.employees && Boolean(formik.errors.employees)}
                        helperText={formik.touched.employees && formik.errors.employees}
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
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Update Survey'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SurveyEdit;

