import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Paper,
  Link,
  CircularProgress,
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
  Login as LoginIcon,
  Security,
  People,
  CheckCircle
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Form validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Enter a valid email')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const result = await login(values.email, values.password);
        if (result.success) {
          toast.success('Login successful!');
          navigate('/dashboard');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('An error occurred during login. Please try again.');
        console.error('Login error:', error);
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha('#ffffff', 0.9)} 50%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                >
                  <Security sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  Survey Management
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                  Welcome back! Please sign in to continue
                </Typography>
              </Box>
            </Slide>

            {/* Login Card */}
            <Slide direction="up" in timeout={1200}>
              <Card
                sx={{
                  width: '100%',
                  maxWidth: 450,
                  borderRadius: 3,
                  boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
                  backdropFilter: 'blur(10px)',
                  background: alpha(theme.palette.background.paper, 0.9),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" component="h2" textAlign="center" sx={{ mb: 3, fontWeight: 600 }}>
                    Sign In
                  </Typography>

                  <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
                    {/* Email Field */}
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email Address"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      margin="normal"
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

                    {/* Password Field */}
                    <TextField
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      margin="normal"
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

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                      sx={{
                        mt: 3,
                        mb: 2,
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.5)}`,
                        },
                        '&:active': {
                          transform: 'translateY(0px)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>

                    <Divider sx={{ my: 3 }}>
                      <Chip label="OR" size="small" />
                    </Divider>

                    {/* Register Link */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Don't have an account?{' '}
                        <Link
                          component={RouterLink}
                          to="/register"
                          sx={{
                            fontWeight: 600,
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Sign up here
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
                    Secure login powered by modern authentication
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
  );
};

export default Login;
