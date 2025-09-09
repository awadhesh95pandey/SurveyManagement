import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText as MuiListItemText,
  Divider,
  Paper,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { departmentApi, employeeApi, surveyApi } from '../../services/api';
import { toast } from 'react-toastify';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const DepartmentSurveyDistribution = ({ 
  open, 
  onClose, 
  surveyId, 
  surveyTitle,
  survey,
  onDistributionComplete 
}) => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [employeePreview, setEmployeePreview] = useState([]);
  const [directReportsData, setDirectReportsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Departments, 2: Preview & Confirm, 3: Results

  useEffect(() => {
    if (open) {
      fetchDepartments();
      setStep(1);
      setSelectedDepartments([]);
      setEmployeePreview([]);
      setDirectReportsData(null);
    }
  }, [open]);

  useEffect(() => {
    if (selectedDepartments.length > 0) {
      fetchEmployeePreview();
    } else {
      setEmployeePreview([]);
    }
  }, [selectedDepartments]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const result = await departmentApi.getDepartments();
      if (result.success) {
              // Fetch employee count for each department in parallel
      const departmentsWithCount = await Promise.all(
        result.data.map(async (dept) => {
          const employeeCounts = await departmentApi.getDepartmentEmployees(dept._id);
          return {
            ...dept,
            employeeCount: employeeCounts.success ? employeeCounts.data.length : 0,
          };
        })
      );
        setDepartments(departmentsWithCount);
      } else {
        toast.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('An error occurred while fetching departments');
    } finally {
      setLoading(false);
    }
  };

const fetchDirectReportsForSurvey = async (survey) => {
  debugger
  if (!survey?.targetEmployees || survey.targetEmployees.length === 0) {
    setDirectReportsData({ success: false, message: "No target employees found" });
    return { success: false, message: "No target employees found" };
  }
  
  try {
    const promises = survey.targetEmployees.map(empObj => {
      const empId = empObj.$oid || empObj;
      return employeeApi.getDirectReports(empId).then(res => ({
        employeeId: empId,
        ...res
      }));
    });

    const results = await Promise.all(promises);

    // Filter only successful ones
    const successful = results.filter(r => r.success).flatMap(r => r.data);

    const directReportsResult = {
      success: true,
      count: successful.length,
      directReports: successful,
      detailedResults: results // keep raw responses if you need errors too
    };

    setDirectReportsData(directReportsResult);
    return directReportsResult;

  } catch (error) {
    console.error("Error fetching direct reports for survey:", error);
    const errorResult = { success: false, message: "Failed to fetch direct reports for survey" };
    setDirectReportsData(errorResult);
    return errorResult;
  }
};

  const fetchEmployeePreview = async () => {
    setPreviewLoading(true);
    try {
      const employeePromises = selectedDepartments.map(deptId => 
        employeeApi.getEmployeesByDepartment(deptId)
      );
      
      const results = await Promise.all(employeePromises);
      const allEmployees = results
        .filter(result => result.success)
        .flatMap(result => result.data)
        .filter((employee, index, self) => 
          index === self.findIndex(e => e._id === employee._id)
        ); // Remove duplicates

      setEmployeePreview(allEmployees);
    } catch (error) {
      console.error('Error fetching employee preview:', error);
      toast.error('An error occurred while fetching employee preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDepartmentChange = (event) => {
    const value = event.target.value;
    setSelectedDepartments(typeof value === 'string' ? value.split(',') : value);
  };

  const handleSendSurveyLinks = async () => {
    setSending(true);
    try {
      // Combine department employees and direct reports
      const departmentEmployeeIds = employeePreview.map(emp => emp._id);
      const directReportIds = directReportsData?.directReports?.map(emp => emp._id) || [];
      
      // Remove duplicates by converting to Set and back to Array
      const allEmployeeIds = [...new Set([...departmentEmployeeIds, ...directReportIds])];

      const payload = {
        departmentIds: selectedDepartments,
        employeeIds: allEmployeeIds
      };

      console.log('Sending survey links with payload:', payload);
      console.log('Department Employee IDs:', departmentEmployeeIds);
      console.log('Direct Report IDs:', directReportIds);
      console.log('Combined Unique Employee IDs:', allEmployeeIds);

      const result = await surveyApi.sendSurveyLinksToDepartments(surveyId, payload);

      const totalRecipients = allEmployeeIds.length;

      if (result.success) {
        toast.success(`Survey links sent successfully to ${totalRecipients} employees`);
        setStep(3);
        if (onDistributionComplete) {
          onDistributionComplete(result.data);
        }
      } else {
        toast.error(result.message || 'Failed to send survey links');
      }
    } catch (error) {
      console.error('Error sending survey links:', error);
      toast.error('An error occurred while sending survey links');
    } finally {
      setSending(false);
    }
  };

  const handleReviewDistribution = async () => {
    // Fetch direct reports when moving to review step
    await fetchDirectReportsForSurvey(survey);
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setSelectedDepartments([]);
    setEmployeePreview([]);
    setDirectReportsData(null);
    onClose();
  };

  const getSelectedDepartmentNames = () => {
    return departments
      .filter(dept => selectedDepartments.includes(dept._id))
      .map(dept => dept.name);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Select Departments
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose the departments whose employees should receive the survey link.
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <FormControl fullWidth margin="normal">
                <InputLabel>Departments</InputLabel>
                <Select
                  multiple
                  value={selectedDepartments}
                  onChange={handleDepartmentChange}
                  input={<OutlinedInput label="Departments" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {getSelectedDepartmentNames().map((name) => (
                        <Chip key={name} label={name} size="small" />
                      ))}
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {departments.map((department) => (
                    <MenuItem key={department._id} value={department._id}>
                      <Checkbox checked={selectedDepartments.indexOf(department._id) > -1} />
                      <ListItemText 
                        primary={department.name}
                        secondary={`${department.code} • ${department.employeeCount || 0} employees`}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedDepartments.length > 0 && (
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Departments Preview
                </Typography>
                <Grid container spacing={2}>
                  {getSelectedDepartmentNames().map((name, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card variant="outlined" size="small">
                        <CardContent sx={{ py: 1 }}>
                          <Box display="flex" alignItems="center">
                            <BusinessIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                            <Typography variant="body2">{name}</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {previewLoading && (
              <Box display="flex" alignItems="center" mt={2}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2">Loading employee preview...</Typography>
              </Box>
            )}

            {employeePreview.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>{employeePreview.length} employees</strong> will receive the survey link
                </Typography>
              </Alert>
            )}
          </>
        );

      case 2:
        const departmentEmployeeIds = employeePreview.map(emp => emp._id);
        const directReportIds = directReportsData?.directReports?.map(emp => emp._id) || [];
        const uniqueEmployeeIds = [...new Set([...departmentEmployeeIds, ...directReportIds])];
        const totalRecipients = uniqueEmployeeIds.length;
        
        return (
          <>
            <Typography variant="h6" gutterBottom>
              Review & Confirm Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please review the details before sending survey links.
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Survey Details
              </Typography>
              <Typography variant="body2">
                <strong>Survey:</strong> {surveyTitle}
              </Typography>
              <Typography variant="body2">
                <strong>Departments:</strong> {getSelectedDepartmentNames().join(', ')}
              </Typography>
              <Typography variant="body2">
                <strong>Department Employees:</strong> {employeePreview.length}
              </Typography>
              {directReportsData?.success && directReportsData.directReports.length > 0 && (
                <Typography variant="body2">
                  <strong>Direct Reports:</strong> {directReportsData.directReports.length}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Total Recipients:</strong> {totalRecipients} employees
              </Typography>
            </Paper>

            {/* Department Employees Section */}
            <Typography variant="subtitle2" gutterBottom>
              Department Employees ({employeePreview.length})
            </Typography>
            <Paper sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
              <List dense>
                {employeePreview.map((employee, index) => (
                  <React.Fragment key={employee._id}>
                    <ListItem>
                      <ListItemIcon>
                        <BusinessIcon color="primary" />
                      </ListItemIcon>
                      <MuiListItemText
                        primary={employee.name}
                        secondary={`${employee.email} • ${employee.department?.name || 'No Department'}`}
                      />
                    </ListItem>
                    {index < employeePreview.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {/* Direct Reports Section */}
            {directReportsData?.success && directReportsData.directReports.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Reports To Manager({directReportsData.directReports.length})
                </Typography>
                <Paper sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                  <List dense>
                    {directReportsData.directReports.map((employee, index) => (
                      <React.Fragment key={employee._id}>
                        <ListItem>
                          <ListItemIcon>
                            <PeopleIcon color="secondary" />
                          </ListItemIcon>
                          <MuiListItemText
                            primary={employee.name}
                            secondary={`${employee.email} • ${employee.department?.name || 'No Department'} • ${employee.role}`}
                          />
                        </ListItem>
                        {index < directReportsData.directReports.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              </>
            )}

            {directReportsData?.success === false && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  No direct reports found for survey target employees.
                </Typography>
              </Alert>
            )}

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Survey links will be sent immediately to all listed employees. 
                Make sure the survey is ready for responses.
              </Typography>
            </Alert>
          </>
        );

      case 3:
        const finalDepartmentEmployeeIds = employeePreview.map(emp => emp._id);
        const finalDirectReportIds = directReportsData?.directReports?.map(emp => emp._id) || [];
        const finalUniqueEmployeeIds = [...new Set([...finalDepartmentEmployeeIds, ...finalDirectReportIds])];
        const finalTotalRecipients = finalUniqueEmployeeIds.length;
        
        return (
          <>
            <Box textAlign="center" py={4}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Survey Links Sent Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Survey links have been sent to {finalTotalRecipients} employees 
                across {selectedDepartments.length} departments.
              </Typography>
              
              <Paper sx={{ p: 2, mt: 2, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Distribution Summary
                </Typography>
                <Typography variant="body2">
                  • <strong>Departments:</strong> {getSelectedDepartmentNames().join(', ')}
                </Typography>
                <Typography variant="body2">
                  • <strong>Department Employees:</strong> {employeePreview.length}
                </Typography>
                {directReportsData?.success && directReportsData.directReports.length > 0 && (
                  <Typography variant="body2">
                    • <strong>Direct Reports:</strong> {directReportsData.directReports.length}
                  </Typography>
                )}
                <Typography variant="body2">
                  • <strong>Total Employees Notified:</strong> {finalTotalRecipients}
                </Typography>
                <Typography variant="body2">
                  • <strong>Survey:</strong> {surveyTitle}
                </Typography>
              </Paper>
            </Box>
          </>
        );

      default:
        return null;
    }
  };

  const renderDialogActions = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleReviewDistribution}
              disabled={selectedDepartments.length === 0 || previewLoading}
              startIcon={<EmailIcon />}
            >
              Review Distribution
            </Button>
          </>
        );

      case 2:
        return (
          <>
            <Button onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleSendSurveyLinks}
              disabled={sending}
              startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
              color="primary"
            >
              {sending ? 'Sending...' : 'Send Survey Links'}
            </Button>
          </>
        );

      case 3:
        return (
          <Button variant="contained" onClick={handleClose}>
            Done
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <BusinessIcon sx={{ mr: 1 }} />
          Send Survey Links by Department
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {renderStepContent()}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {renderDialogActions()}
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentSurveyDistribution;
