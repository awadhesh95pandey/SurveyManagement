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
  ListItemIcon
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
    try {
      await employeeApi.downloadSampleTemplate(format);
      toast.success(`Sample template downloaded as ${format}`);
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Import Employees
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload employees in bulk using an Excel or CSV file.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Employees File
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>File Format Requirements</AlertTitle>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
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
                >
                  Select File
                </Button>
              </label>
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {file.name}
                </Typography>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || !!error || uploadLoading}
              startIcon={uploadLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              fullWidth
            >
              {uploadLoading ? 'Importing...' : 'Import Employees'}
            </Button>
          </Paper>
        </Grid>

        {/* Sample Download Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Download Sample Template
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Download a sample file to see the correct format for employee import.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  onClick={() => handleDownloadSample('xlsx')}
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Download Sample (Excel)
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  onClick={() => handleDownloadSample('csv')}
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Download Sample (CSV)
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Preview Section */}
        {previewData.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                File Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>{previewData.length} employees</strong> will be imported
              </Typography>

              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Position</TableCell>
                      <TableCell>Employee ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((employee, index) => (
                      <TableRow key={index}>
                        <TableCell>{employee.Name}</TableCell>
                        <TableCell>{employee.Email}</TableCell>
                        <TableCell>{employee.Department}</TableCell>
                        <TableCell>
                          <Chip 
                            label={employee.Role} 
                            color={getRoleColor(employee.Role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{employee.Position || '-'}</TableCell>
                        <TableCell>{employee['Employee ID'] || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Import Results Section */}
        {importResults && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Import Results
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" color="success.main">
                        {importResults.successful}
                      </Typography>
                      <Typography variant="body2">
                        Successfully Imported
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                      <ErrorIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                      <Typography variant="h4" color="error.main">
                        {importResults.failed}
                      </Typography>
                      <Typography variant="body2">
                        Failed to Import
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <PersonIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" color="info.main">
                        {importResults.successful + importResults.failed}
                      </Typography>
                      <Typography variant="body2">
                        Total Processed
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Errors Section */}
              {importResults.errors && importResults.errors.length > 0 && (
                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" color="error">
                      Import Errors ({importResults.errors.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {importResults.errors.map((error, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <ErrorIcon color="error" />
                          </ListItemIcon>
                          <ListItemText primary={error} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Successfully Imported Employees */}
              {importResults.employees && importResults.employees.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" color="success.main">
                      Successfully Imported Employees ({importResults.employees.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Position</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {importResults.employees.map((employee, index) => (
                            <TableRow key={index}>
                              <TableCell>{employee.name}</TableCell>
                              <TableCell>{employee.email}</TableCell>
                              <TableCell>{employee.department?.name || '-'}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={employee.role} 
                                  color={getRoleColor(employee.role)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{employee.position || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setImportResults(null);
                    setPreviewData([]);
                    setFile(null);
                    setError(null);
                  }}
                >
                  Import More Employees
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default EmployeeImport;

