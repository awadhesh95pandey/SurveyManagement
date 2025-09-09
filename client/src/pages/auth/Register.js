import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Link,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
  Avatar,
  Fade,
  Slide,
  Divider,
  Chip,
  Card,
  CardContent,
  alpha,
  useTheme
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Person,
  Business,
  Badge,
  PersonAdd,
  Security,
  CheckCircle
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import SimpleParticleRing from '../../components/animations/SimpleParticleRing';

const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const theme = useTheme();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Name is required')
      .min(2, 'Name should be at least 2 characters'),
    email: Yup.string()
      .email('Enter a valid email')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password should be at least 6 characters'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required'),
    department: Yup.string()
      .required('Department is required'),
    employeeId: Yup.string()
      .required('Employee ID is required')
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: '',
      employeeId: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { confirmPassword, ...userData } = values;
        const result = await register(userData);
        if (result.success) {
          toast.success('Registration successful!');
          navigate('/dashboard');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('An error occurred during registration. Please try again.');
        console.error('Registration error:', error);
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <SimpleParticleRing>
      <Box
        sx={{
          minHeight: '100vh',
          height: '100vh',
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha('#ffffff', 0.9)} 50%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          py: 4,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f87171' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.6,
          }
        }}
      >
      <Container maxWidth={false} sx={{ width: '100%' }}>
        <Fade in timeout={800}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Header Section */}
            <Slide direction="down" in timeout={1000}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.4)}`,
                  }}
                >
                  <PersonAdd sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  Survey Management
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                  Create your account to get started
                </Typography>
              </Box>
            </Slide>

            {/* Register Card */}
            <Slide direction="up" in timeout={1200}>
              <Card
                sx={{
                  width: '100%',
                  maxWidth: 600,
                  borderRadius: 3,
                  boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
                  backdropFilter: 'blur(10px)',
                  background: alpha(theme.palette.background.paper, 0.9),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" component="h2" textAlign="center" sx={{ mb: 3, fontWeight: 600 }}>
                    Create Account
                  </Typography>

                  <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
                    <Grid container spacing={3}>
                      {/* Full Name */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          id="name"
                          name="name"
                          label="Full Name"
                          autoComplete="name"
                          autoFocus
                          value={formik.values.name}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.name && Boolean(formik.errors.name)}
                          helperText={formik.touched.name && formik.errors.name}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person color={formik.touched.name && formik.errors.name ? 'error' : 'action'} />
                              </InputAdornment>
                            ),
                            endAdornment: formik.touched.name && !formik.errors.name && formik.values.name && (
                              <InputAdornment position="end">
                                <CheckCircle color="success" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'white !important',
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              '&:hover': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              backgroundColor: 'white !important',
                              '&::placeholder': {
                                color: theme.palette.text.secondary,
                                opacity: 1,
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              background: 'white',
                              padding: '1px 5px',
                              '&.Mui-focused': {
                                color: theme.palette.primary.main,
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              fontSize: '0.8rem',
                            },
                          }}
                        />
                      </Grid>

                      {/* Email */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          id="email"
                          name="email"
                          label="Email Address"
                          type="email"
                          autoComplete="email"
                          value={formik.values.email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.email && Boolean(formik.errors.email)}
                          helperText={formik.touched.email && formik.errors.email}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email color={formik.touched.email && formik.errors.email ? 'error' : 'action'} />
                              </InputAdornment>
                            ),
                            endAdornment: formik.touched.email && !formik.errors.email && formik.values.email && (
                              <InputAdornment position="end">
                                <CheckCircle color="success" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'white !important',
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              '&:hover': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              backgroundColor: 'white !important',
                              '&::placeholder': {
                                color: theme.palette.text.secondary,
                                opacity: 1,
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              background: 'white',
                              padding: '1px 5px',
                              '&.Mui-focused': {
                                color: theme.palette.primary.main,
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              fontSize: '0.8rem',
                            },
                          }}
                        />
                      </Grid>

                      {/* Password */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="password"
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          autoComplete="new-password"
                          value={formik.values.password}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.password && Boolean(formik.errors.password)}
                          helperText={formik.touched.password && formik.errors.password}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock color={formik.touched.password && formik.errors.password ? 'error' : 'action'} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    '&:hover': {
                                      color: theme.palette.primary.main,
                                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                    },
                                  }}
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'white !important',
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              '&:hover': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              backgroundColor: 'white !important',
                              '&::placeholder': {
                                color: theme.palette.text.secondary,
                                opacity: 1,
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              background: 'white',
                              padding: '1px 5px',
                              '&.Mui-focused': {
                                color: theme.palette.primary.main,
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              fontSize: '0.8rem',
                            },
                          }}
                        />
                      </Grid>

                      {/* Confirm Password */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="confirmPassword"
                          label="Confirm Password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          value={formik.values.confirmPassword}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                          helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock color={formik.touched.confirmPassword && formik.errors.confirmPassword ? 'error' : 'action'} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle confirm password visibility"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    '&:hover': {
                                      color: theme.palette.primary.main,
                                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                    },
                                  }}
                                >
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'white !important',
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              '&:hover': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              backgroundColor: 'white !important',
                              '&::placeholder': {
                                color: theme.palette.text.secondary,
                                opacity: 1,
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              background: 'white',
                              padding: '1px 5px',
                              '&.Mui-focused': {
                                color: theme.palette.primary.main,
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              fontSize: '0.8rem',
                            },
                          }}
                        />
                      </Grid>

                      {/* Department */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          id="department"
                          name="department"
                          label="Department"
                          value={formik.values.department}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.department && Boolean(formik.errors.department)}
                          helperText={formik.touched.department && formik.errors.department}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Business color={formik.touched.department && formik.errors.department ? 'error' : 'action'} />
                              </InputAdornment>
                            ),
                            endAdornment: formik.touched.department && !formik.errors.department && formik.values.department && (
                              <InputAdornment position="end">
                                <CheckCircle color="success" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'white !important',
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              '&:hover': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              backgroundColor: 'white !important',
                              '&::placeholder': {
                                color: theme.palette.text.secondary,
                                opacity: 1,
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              background: 'white',
                              padding: '1px 5px',
                              '&.Mui-focused': {
                                color: theme.palette.primary.main,
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              fontSize: '0.8rem',
                            },
                          }}
                        />
                      </Grid>

                      {/* Employee ID */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          id="employeeId"
                          name="employeeId"
                          label="Employee ID"
                          value={formik.values.employeeId}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.employeeId && Boolean(formik.errors.employeeId)}
                          helperText={formik.touched.employeeId && formik.errors.employeeId}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Badge color={formik.touched.employeeId && formik.errors.employeeId ? 'error' : 'action'} />
                              </InputAdornment>
                            ),
                            endAdornment: formik.touched.employeeId && !formik.errors.employeeId && formik.values.employeeId && (
                              <InputAdornment position="end">
                                <CheckCircle color="success" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'white !important',
                              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                              '&:hover': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'white !important',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                  borderWidth: 2,
                                },
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: theme.palette.text.primary,
                              fontSize: '0.95rem',
                              backgroundColor: 'white !important',
                              '&::placeholder': {
                                color: theme.palette.text.secondary,
                                opacity: 1,
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              background: 'white',
                              padding: '1px 5px',
                              '&.Mui-focused': {
                                color: theme.palette.primary.main,
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              fontSize: '0.8rem',
                            },
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
                      sx={{
                        mt: 4,
                        mb: 2,
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.4)}`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 40px ${alpha(theme.palette.secondary.main, 0.5)}`,
                        },
                        '&:active': {
                          transform: 'translateY(0px)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>

                    <Divider sx={{ my: 3 }}>
                      <Chip label="OR" size="small" />
                    </Divider>

                    {/* Login Link */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Already have an account?{' '}
                        <Link
                          component={RouterLink}
                          to="/login"
                          sx={{
                            fontWeight: 600,
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Sign in here
                        </Link>
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Slide>

            {/* Footer */}
            <Slide direction="up" in timeout={1400}>
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                  <Security color="primary" sx={{ fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Join thousands of users managing surveys efficiently
                  </Typography>
                </Box>
              
              </Box>
            </Slide>
          </Box>
        </Fade>
      </Container>
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          backgroundColor: 'white',
          color: '#374151',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }}
        progressStyle={{
          background: 'linear-gradient(to right, #dc2626, #ef4444)',
        }}
      />
      </Box>
    </SimpleParticleRing>
  );
};

export default Register;
