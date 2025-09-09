import React, { useState } from 'react';
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
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Slide,
  Card,
  CardContent,
  Stack,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '../../services/api';
import { toast } from 'react-toastify';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import * as XLSX from 'xlsx';

const EmployeeImport = () => {
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setImportResults(null);

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
        const requiredColumns = ['Name', 'Email', 'Department', 'Role'];
        const optionalColumns = ['Manager Email', 'Position', 'Employee ID', 'Phone Number'];
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
          // Check if name is provided
          if (!row.Name || row.Name.trim() === '') {
            errors.push(`Row ${index + 1}: Name is required`);
            return;
          }

          // Check if email is provided and valid
          if (!row.Email || row.Email.trim() === '') {
            errors.push(`Row ${index + 1}: Email is required`);
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.Email.trim())) {
            errors.push(`Row ${index + 1}: Invalid email format`);
            return;
          }

          // Check if department is provided
          if (!row.Department || row.Department.trim() === '') {
            errors.push(`Row ${index + 1}: Department is required`);
            return;
          }

          // Check if role is provided and valid
          if (!row.Role || row.Role.trim() === '') {
            errors.push(`Row ${index + 1}: Role is required`);
            return;
          }

          const validRoles = ['admin', 'manager', 'employee'];
          if (!validRoles.includes(row.Role.trim().toLowerCase())) {
            errors.push(`Row ${index + 1}: Invalid role '${row.Role}'. Must be one of: ${validRoles.join(', ')}`);
            return;
          }

          // Validate Manager Email format if provided
          if (row['Manager Email'] && row['Manager Email'].trim() !== '') {
            const managerEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!managerEmailRegex.test(row['Manager Email'].trim())) {
              errors.push(`Row ${index + 1}: Invalid manager email format`);
              return;
            }
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
    debugger
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

      const result = await employeeApi.importEmployees(formData);
      if (result.success) {
        setImportResults(result.data);
        toast.success(result.message || 'Employees imported successfully');
        setFile(null);
        setPreviewData([]);
        
        // Reset file input
        const fileInput = document.getElementById('employee-file-upload');
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        toast.error(result.message || 'Failed to import employees');
      }
    } catch (error) {
      console.error('Error importing employees:', error);
      toast.error('An error occurred while importing employees');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadSample = async (format = 'xlsx') => {
    debugger
    try {
      const result = await employeeApi.downloadSampleTemplateEmp(format);
      if (result.success) {
        toast.success(`Sample template downloaded as ${format}`);
      } else {
        toast.error(result.message || 'Failed to download sample template');
      }
    } catch (error) {
      console.error('Error downloading sample template:', error);
      toast.error('Failed to download sample template');
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'employee':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.01)} 0%, ${alpha('#ffffff', 0.95)} 50%, ${alpha(theme.palette.secondary.main, 0.01)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        <CircularProgress size={isMobile ? 30 : 40} />
      </Box>
    );
  }

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
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 2 }}>
        {/* Header Section */}
        <Fade in timeout={800}>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                fontSize: isMobile ? '1.5rem' : '2rem',
                mb: 0.5
              }}
            >
              Import Employees
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
            >
              Upload employees in bulk using an Excel or CSV file.
            </Typography>
          </Box>
        </Fade>

        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <Slide direction="up" in timeout={1000}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                height: '100%'
              }}>
                <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      width: 32, 
                      height: 32, 
                      mr: 1.5 
                    }}>
                      <CloudUploadIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    </Avatar>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? '1rem' : '1.25rem' 
                      }}
                    >
                      Upload Employees File
                    </Typography>
                  </Box>
                  
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 2, 
                      borderRadius: 2,
                      '& .MuiAlert-message': {
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                      }
                    }}
                  >
                    <AlertTitle sx={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                      File Format Requirements
                    </AlertTitle>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                      <li>File must be Excel (.xlsx) or CSV format</li>
                      <li>Required columns: Name, Email, Department, Role</li>
                      <li>Optional columns: Position, Employee ID, Phone Number, Manager Email</li>
                      <li>Valid roles: admin, manager, employee</li>
                      <li>Department must exist in the system</li>
                      <li>Manager Email must be an existing user's email</li>
                    </ul>
                  </Alert>

                  <Box sx={{ mb: 2 }}>
                    <input
                      accept=".csv,.xlsx,.xls"
                      style={{ display: 'none' }}
                      id="employee-file-upload"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="employee-file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          color: theme.palette.primary.main,
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          py: isMobile ? 1 : 1.5,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          }
                        }}
                      >
                        Select File
                      </Button>
                    </label>
                    {file && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 1, 
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: 'text.secondary'
                        }}
                      >
                        Selected file: {file.name}
                      </Typography>
                    )}
                  </Box>

                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        '& .MuiAlert-message': {
                          fontSize: isMobile ? '0.75rem' : '0.875rem'
                        }
                      }}
                    >
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{error}</pre>
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={!file || !!error || uploadLoading}
                    startIcon={uploadLoading ? <CircularProgress size={isMobile ? 16 : 20} /> : <CloudUploadIcon />}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      py: isMobile ? 1 : 1.5,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                      transition: 'all 0.2s ease-in-out',
                      '&:disabled': {
                        background: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                        transform: 'none',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {uploadLoading ? 'Importing...' : 'Import Employees'}
                  </Button>
                </CardContent>
              </Card>
            </Slide>
          </Grid>

          {/* Sample Download Section */}
          <Grid item xs={12} md={6}>
            <Slide direction="up" in timeout={1200}>
              <Card sx={{ 
                borderRadius: 2,
                boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                height: '100%'
              }}>
                <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                      width: 32, 
                      height: 32, 
                      mr: 1.5 
                    }}>
                      <DownloadIcon sx={{ fontSize: 18, color: theme.palette.secondary.main }} />
                    </Avatar>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? '1rem' : '1.25rem' 
                      }}
                    >
                      Download Sample Template
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2, 
                      fontSize: isMobile ? '0.75rem' : '0.875rem' 
                    }}
                  >
                    Download a sample file to see the correct format for employee import.
                  </Typography>

                  <Stack spacing={1.5}>
                    <Button
                      variant="outlined"
                      onClick={() => handleDownloadSample('xlsx')}
                      startIcon={<DownloadIcon />}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                        color: theme.palette.secondary.main,
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        py: isMobile ? 1 : 1.5,
                        '&:hover': {
                          borderColor: theme.palette.secondary.main,
                          backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                        }
                      }}
                    >
                      Download Sample (XLSX)
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleDownloadSample('csv')}
                      startIcon={<DownloadIcon />}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                        color: theme.palette.secondary.main,
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        py: isMobile ? 1 : 1.5,
                        '&:hover': {
                          borderColor: theme.palette.secondary.main,
                          backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                        }
                      }}
                    >
                      Download Sample (CSV)
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Slide>
          </Grid>

          {/* Preview Section */}
          {previewData.length > 0 && (
            <Grid item xs={12}>
              <Slide direction="up" in timeout={1400}>
                <Card sx={{ 
                  borderRadius: 2,
                  boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.info.main, 0.1), 
                        width: 32, 
                        height: 32, 
                        mr: 1.5 
                      }}>
                        <PersonIcon sx={{ fontSize: 18, color: theme.palette.info.main }} />
                      </Avatar>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"} 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: isMobile ? '1rem' : '1.25rem' 
                        }}
                      >
                        File Preview
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2, 
                        fontSize: isMobile ? '0.75rem' : '0.875rem' 
                      }}
                    >
                      <strong>{previewData.length} employees</strong> will be imported
                    </Typography>

                    <TableContainer sx={{ 
                      maxHeight: isMobile ? 300 : 400,
                      borderRadius: 1,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      '&::-webkit-scrollbar': {
                        width: '6px',
                        height: '6px'
                      },
                      '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '3px'
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#c1c1c1',
                        borderRadius: '3px',
                        '&:hover': {
                          background: '#a8a8a8'
                        }
                      }
                    }}>
                      <Table stickyHeader size={isMobile ? "small" : "medium"}>
                        <TableHead>
                          <TableRow>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Name
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Email
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Department
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Role
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Position
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Employee ID
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                fontWeight: 600, 
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                backgroundColor: theme.palette.grey[50]
                              }}
                            >
                              Manager Email
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewData.map((employee, index) => (
                            <TableRow 
                              key={index}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: theme.palette.action.hover 
                                }
                              }}
                            >
                              <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {employee.Name}
                              </TableCell>
                              <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {employee.Email}
                              </TableCell>
                              <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {employee.Department}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={employee.Role} 
                                  color={getRoleColor(employee.Role)}
                                  size="small"
                                  sx={{ 
                                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                                    height: isMobile ? 24 : 28
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {employee.Position || '-'}
                              </TableCell>
                              <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {employee['Employee ID'] || '-'}
                              </TableCell>
                              <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                {employee['Manager Email'] || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          )}

          {/* Import Results Section */}
          {importResults && (
            <Grid item xs={12}>
              <Slide direction="up" in timeout={1600}>
                <Card sx={{ 
                  borderRadius: 2,
                  boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.success.main, 0.1), 
                        width: 32, 
                        height: 32, 
                        mr: 1.5 
                      }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                      </Avatar>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"} 
                        sx={{ 
                          fontWeight: 600, 
                          fontSize: isMobile ? '1rem' : '1.25rem' 
                        }}
                      >
                        Import Results
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Card sx={{ 
                          textAlign: 'center', 
                          p: isMobile ? 1.5 : 2, 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, ${alpha(theme.palette.success.main, 0.12)})`,
                          borderRadius: 2,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.1)}`,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
                        }}>
                          <CheckCircleIcon sx={{ 
                            fontSize: isMobile ? 28 : 40, 
                            color: 'success.main', 
                            mb: 1 
                          }} />
                          <Typography 
                            variant="h4" 
                            color="success.main"
                            sx={{ 
                              fontSize: isMobile ? '1.5rem' : '2rem',
                              fontWeight: 700,
                              lineHeight: 1
                            }}
                          >
                            {importResults.successful}
                          </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                          >
                            Successfully Imported
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card sx={{ 
                          textAlign: 'center', 
                          p: isMobile ? 1.5 : 2, 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.08)}, ${alpha(theme.palette.error.main, 0.12)})`,
                          borderRadius: 2,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.1)}`,
                          border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`
                        }}>
                          <ErrorIcon sx={{ 
                            fontSize: isMobile ? 28 : 40, 
                            color: 'error.main', 
                            mb: 1 
                          }} />
                          <Typography 
                            variant="h4" 
                            color="error.main"
                            sx={{ 
                              fontSize: isMobile ? '1.5rem' : '2rem',
                              fontWeight: 700,
                              lineHeight: 1
                            }}
                          >
                            {importResults.failed}
                          </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                          >
                            Failed to Import
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={4}>
                        <Card sx={{ 
                          textAlign: 'center', 
                          p: isMobile ? 1.5 : 2, 
                          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)}, ${alpha(theme.palette.info.main, 0.12)})`,
                          borderRadius: 2,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.info.main, 0.1)}`,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`
                        }}>
                          <PersonIcon sx={{ 
                            fontSize: isMobile ? 28 : 40, 
                            color: 'info.main', 
                            mb: 1 
                          }} />
                          <Typography 
                            variant="h4" 
                            color="info.main"
                            sx={{ 
                              fontSize: isMobile ? '1.5rem' : '2rem',
                              fontWeight: 700,
                              lineHeight: 1
                            }}
                          >
                            {importResults.successful + importResults.failed}
                          </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ fontSize: isMobile ? '0.7rem' : '0.875rem' }}
                          >
                            Total Processed
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Errors Section */}
                    {importResults.errors && importResults.errors.length > 0 && (
                      <Accordion sx={{ mb: 2, borderRadius: 2 }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ 
                            borderRadius: 2,
                            '&.Mui-expanded': {
                              borderRadius: '8px 8px 0 0'
                            }
                          }}
                        >
                          <Typography 
                            variant="subtitle1" 
                            color="error"
                            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                          >
                            Import Errors ({importResults.errors.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <List dense>
                            {importResults.errors.map((error, index) => (
                              <ListItem key={index} sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <ErrorIcon color="error" sx={{ fontSize: 18 }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={
                                    <Typography sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                      {error}
                                    </Typography>
                                  } 
                                />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Successfully Imported Employees */}
                    {importResults.employees && importResults.employees.length > 0 && (
                      <Accordion sx={{ borderRadius: 2 }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ 
                            borderRadius: 2,
                            '&.Mui-expanded': {
                              borderRadius: '8px 8px 0 0'
                            }
                          }}
                        >
                          <Typography 
                            variant="subtitle1" 
                            color="success.main"
                            sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
                          >
                            Successfully Imported Employees ({importResults.employees.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <TableContainer sx={{ 
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            '&::-webkit-scrollbar': {
                              width: '6px',
                              height: '6px'
                            },
                            '&::-webkit-scrollbar-track': {
                              background: '#f1f1f1',
                              borderRadius: '3px'
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: '#c1c1c1',
                              borderRadius: '3px',
                              '&:hover': {
                                background: '#a8a8a8'
                              }
                            }
                          }}>
                            <Table size={isMobile ? "small" : "medium"}>
                              <TableHead>
                                <TableRow>
                                  <TableCell 
                                    sx={{ 
                                      fontWeight: 600, 
                                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                                      backgroundColor: theme.palette.grey[50]
                                    }}
                                  >
                                    Name
                                  </TableCell>
                                  <TableCell 
                                    sx={{ 
                                      fontWeight: 600, 
                                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                                      backgroundColor: theme.palette.grey[50]
                                    }}
                                  >
                                    Email
                                  </TableCell>
                                  <TableCell 
                                    sx={{ 
                                      fontWeight: 600, 
                                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                                      backgroundColor: theme.palette.grey[50]
                                    }}
                                  >
                                    Department
                                  </TableCell>
                                  <TableCell 
                                    sx={{ 
                                      fontWeight: 600, 
                                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                                      backgroundColor: theme.palette.grey[50]
                                    }}
                                  >
                                    Role
                                  </TableCell>
                                  <TableCell 
                                    sx={{ 
                                      fontWeight: 600, 
                                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                                      backgroundColor: theme.palette.grey[50]
                                    }}
                                  >
                                    Position
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {importResults.employees.map((employee, index) => (
                                  <TableRow 
                                    key={index}
                                    sx={{ 
                                      '&:hover': { 
                                        backgroundColor: theme.palette.action.hover 
                                      }
                                    }}
                                  >
                                    <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                      {employee.name}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                      {employee.email}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                      {employee.department?.name || '-'}
                                    </TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={employee.role} 
                                        color={getRoleColor(employee.role)}
                                        size="small"
                                        sx={{ 
                                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                                          height: isMobile ? 24 : 28
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                      {employee.position || '-'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        onClick={() => {
                          setImportResults(null);
                          setPreviewData([]);
                          setFile(null);
                          setError(null);
                        }}
                        size={isMobile ? "small" : "medium"}
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          py: isMobile ? 1 : 1.5,
                          px: 3,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        Import More Employees
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default EmployeeImport;
