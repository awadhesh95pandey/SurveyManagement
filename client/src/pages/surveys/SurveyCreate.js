import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Divider,
  Autocomplete,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { surveyApi, employeeApi } from '../../services/api';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const SurveyCreate = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
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
    targetUsers: Yup.array()
      .min(1, 'Select at least one user for the survey')
      .required('Target users are required')
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      name: '',
      publishDate: null,
      durationDays: 7,
      targetUsers: []
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
          targetUsers: values.targetUsers.map(user => user.id)
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

  // Fetch users function
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await employeeApi.getEmployees();
      if (result.success) {
        const userData = result.data.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          department: user.department?.name || 'No Department',
          role: user.role
        }));
        setUsers(userData);
      } else {
        toast.error(result.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

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
                <Autocomplete
                  multiple
                  id="targetUsers"
                  options={users}
                  getOptionLabel={(option) => `${option.name} (${option.email}) - ${option.department}`}
                  value={formik.values.targetUsers}
                  onChange={(event, newValue) => {
                    formik.setFieldValue('targetUsers', newValue);
                  }}
                  loading={loadingUsers}
                  disabled={loadingUsers}
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
                      label="Target Users"
                      placeholder={loadingUsers ? "Loading users..." : "Select users for the survey"}
                      error={formik.touched.targetUsers && Boolean(formik.errors.targetUsers)}
                      helperText={formik.touched.targetUsers && formik.errors.targetUsers}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
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
