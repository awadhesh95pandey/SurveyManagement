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
import { surveyApi, departmentApi, employeeApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const SurveyEdit = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Survey name is required')
      .min(3, 'Survey name must be at least 3 characters'),
    publishDate: Yup.date()
      .required('Publish Date is required'),
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
      setSubmitting(true);
      try {
        // Format the data for API
        const surveyData = {
          ...values,
          publishDate: values.publishDate ? new Date(values.publishDate).toISOString() : null,
          targetEmployees: values.targetEmployees.map(emp => emp.id)
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
    fetchDepartments();
    fetchSurvey();
  }, [id]);

  // Fetch employees when department changes
  useEffect(() => {
    if (formik.values.department && formik.values.department !== 'All Departments') {
      fetchEmployees(formik.values.department);
    } else if (formik.values.department === 'All Departments') {
      fetchEmployees();
    }
  }, [formik.values.department]);

  // Fetch departments function
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const result = await departmentApi.getDepartments();
      if (result.success) {
        // Add "All Departments" option
        const departmentOptions = [
          ...result.data.map(dept => dept.name),
          'All Departments'
        ];
        setDepartments(departmentOptions);
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

  // Fetch selected employees by IDs (for edit mode)
  const fetchSelectedEmployees = async (employeeIds) => {
    if (!employeeIds || employeeIds.length === 0) return [];
    
    try {
      const result = await employeeApi.getEmployees();
      if (result.success) {
        const selectedEmployees = result.data
          .filter(emp => employeeIds.includes(emp._id))
          .map(emp => ({
            id: emp._id,
            name: emp.name,
            email: emp.email,
            department: emp.department?.name || 'No Department',
            role: emp.role
          }));
        return selectedEmployees;
      }
    } catch (error) {
      console.error('Error fetching selected employees:', error);
    }
    return [];
  };

  const fetchSurvey = async () => {
    setLoading(true);
    try {
      const result = await surveyApi.getSurvey(id);
      if (result.success) {
        const surveyData = result.data;
        setSurvey(surveyData);
        
        // Fetch selected employees if they exist
        const selectedEmployees = await fetchSelectedEmployees(surveyData.targetEmployees || []);
        
        // Populate form with existing data
        formik.setValues({
          name: surveyData.name || '',
          publishDate: surveyData.publishDate ? new Date(surveyData.publishDate).toISOString().split('T')[0] : null,
          durationDays: surveyData.durationDays || 7,
          department: surveyData.department || '',
          targetEmployees: selectedEmployees
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

  // Filter employees based on selected department (already handled in fetchEmployees)

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
                    disabled={loadingDepartments}
                    onChange={(e) => {
                      formik.setFieldValue('department', e.target.value);
                      // Reset employees when department changes
                      formik.setFieldValue('targetEmployees', []);
                    }}
                    onBlur={formik.handleBlur}
                  >
                    {loadingDepartments ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading departments...
                      </MenuItem>
                    ) : (
                      departments.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))
                    )}
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
