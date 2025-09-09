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
  Warning as WarningIcon,
  SupervisorAccount as ManagerIcon,
  Group as TeamIcon
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
  onDistributionComplete 
}) => {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [employeePreview, setEmployeePreview] = useState([]);
  const [expandedEmployeeData, setExpandedEmployeeData] = useState(null);
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
      setExpandedEmployeeData(null);
    }
  }, [open]);

  useEffect(() => {
    if (selectedDepartments.length > 0) {
      fetchEmployeePreview();
    } else {
      setEmployeePreview([]);
      setExpandedEmployeeData(null);
    }
  }, [selectedDepartments]);

  const fetchDepartments = async () => {
    debugger;
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

  const fetchEmployeePreview = async () => {
    debugger;
    setPreviewLoading(true);
    try {
      const expandedDataPromises = selectedDepartments.map(deptId => 
        employeeApi.getEmployeesByDepartmentExpanded(deptId, { 
          includeSubdepartments: 'false',
          active: 'true' 
        })
      );
      
      const results = await Promise.all(expandedDataPromises);
      const successfulResults = results.filter(result => result.success);
      
      if (successfulResults.length === 0) {
        setEmployeePreview([]);
        setExpandedEmployeeData(null);
        return;
      }

      // Combine all target employees and additional employees
      let allTargetEmployees = [];
      let allAdditionalEmployees = [];
      let combinedSummary = {
        targetCount: 0,
        additionalCount: 0,
        totalCount: 0,
        managersFromOtherDepts: 0,
        directReportsFromOtherDepts: 0
      };

      successfulResults.forEach(result => {
        const data = result.data;
        
        // Merge target employees (remove duplicates)
        data.targetEmployees.forEach(emp => {
          if (!allTargetEmployees.find(existing => existing._id === emp._id)) {
            allTargetEmployees.push(emp);
          }
        });
        
        // Merge additional employees (remove duplicates)
        data.additionalEmployees.forEach(emp => {
          if (!allAdditionalEmployees.find(existing => existing._id === emp._id)) {
            allAdditionalEmployees.push(emp);
          }
        });
        
        // Combine summary stats
        combinedSummary.managersFromOtherDepts += data.summary.managersFromOtherDepts;
        combinedSummary.directReportsFromOtherDepts += data.summary.directReportsFromOtherDepts;
      });

      // Update final counts
      combinedSummary.targetCount = allTargetEmployees.length;
      combinedSummary.additionalCount = allAdditionalEmployees.length;
      combinedSummary.totalCount = allTargetEmployees.length + allAdditionalEmployees.length;

      // Set the expanded data structure
      const expandedData = {
        targetEmployees: allTargetEmployees,
        additionalEmployees: allAdditionalEmployees,
        summary: combinedSummary
      };

      setExpandedEmployeeData(expandedData);
      
      // For backward compatibility, set employeePreview to target employees
      setEmployeePreview(allTargetEmployees);
      
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
      const result = await surveyApi.sendSurveyLinksToDepartments(surveyId, {
        departmentIds: selectedDepartments,
        employeeIds: employeePreview.map(emp => emp._id)
      });

      if (result.success) {
        toast.success(`Survey links sent successfully to ${employeePreview.length} employees`);
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

  const handleClose = () => {
    setStep(1);
    setSelectedDepartments([]);
    setEmployeePreview([]);
    setExpandedEmployeeData(null);
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
                {expandedEmployeeData && expandedEmployeeData.summary.additionalCount > 0 && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Plus {expandedEmployeeData.summary.additionalCount} related employees (managers/direct reports) 
                    from other departments will be visible for organizational context
                  </Typography>
                )}
              </Alert>
            )}
          </>
        );

      case 2:
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
                <strong>Survey Recipients:</strong> {employeePreview.length} employees
              </Typography>
              
              {/* Expanded Network Summary */}
              {expandedEmployeeData && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    <strong>Expanded Organizational Network:</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    • Target Employees (from selected departments): {expandedEmployeeData.summary.targetCount}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    • Additional Employees (managers/reports from other departments): {expandedEmployeeData.summary.additionalCount}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    • Managers from Other Departments: {expandedEmployeeData.summary.managersFromOtherDepts}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    • Direct Reports from Other Departments: {expandedEmployeeData.summary.directReportsFromOtherDepts}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                    • Total Network Size: {expandedEmployeeData.summary.totalCount} employees
                  </Typography>
                </Box>
              )}
            </Paper>

            <Typography variant="subtitle2" gutterBottom>
              Complete Organizational Network
            </Typography>
            <Paper sx={{ maxHeight: 500, overflow: 'auto' }}>
              {expandedEmployeeData ? (
                <>
                  {/* Target Employees Section */}
                  <Box sx={{ p: 2, bgcolor: 'primary.50', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600, mb: 1 }}>
                      📋 Survey Recipients ({expandedEmployeeData.summary.targetCount})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Employees from selected departments who will receive the survey
                    </Typography>
                  </Box>
                  <List dense>
                    {expandedEmployeeData.targetEmployees.map((employee, index) => (
                      <React.Fragment key={`target-${employee._id}`}>
                        <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2, bgcolor: 'primary.25' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <PeopleIcon color="primary" />
                            </ListItemIcon>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {employee.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {employee.email} • {employee.department?.name || 'No Department'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Manager Information */}
                          {employee.managerId && (
                            <Box sx={{ ml: 5, mb: 0.5, display: 'flex', alignItems: 'center' }}>
                              <ManagerIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                <strong>Manager:</strong> {employee.managerId.name} ({employee.managerId.email})
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Direct Reports Information */}
                          {employee.directReports && employee.directReports.length > 0 && (
                            <Box sx={{ ml: 5, display: 'flex', alignItems: 'center' }}>
                              <TeamIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                <strong>Direct Reports ({employee.directReports.length}):</strong>{' '}
                                {employee.directReports.map(report => report.name).join(', ')}
                              </Typography>
                            </Box>
                          )}
                        </ListItem>
                        {index < expandedEmployeeData.targetEmployees.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>

                  {/* Additional Employees Section */}
                  {expandedEmployeeData.additionalEmployees.length > 0 && (
                    <>
                      <Box sx={{ p: 2, bgcolor: 'warning.50', borderTop: '2px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 600, mb: 1 }}>
                          🔗 Related Employees ({expandedEmployeeData.summary.additionalCount})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Managers and direct reports from other departments (for organizational context)
                        </Typography>
                      </Box>
                      <List dense>
                        {expandedEmployeeData.additionalEmployees.map((employee, index) => (
                          <React.Fragment key={`additional-${employee._id}`}>
                            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2, bgcolor: 'warning.25' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                  <PeopleIcon color="warning" />
                                </ListItemIcon>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {employee.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {employee.email} • {employee.department?.name || 'No Department'}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {/* Manager Information */}
                              {employee.managerId && (
                                <Box sx={{ ml: 5, mb: 0.5, display: 'flex', alignItems: 'center' }}>
                                  <ManagerIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    <strong>Manager:</strong> {employee.managerId.name} ({employee.managerId.email})
                                  </Typography>
                                </Box>
                              )}
                              
                              {/* Direct Reports Information */}
                              {employee.directReports && employee.directReports.length > 0 && (
                                <Box sx={{ ml: 5, display: 'flex', alignItems: 'center' }}>
                                  <TeamIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    <strong>Direct Reports ({employee.directReports.length}):</strong>{' '}
                                    {employee.directReports.map(report => report.name).join(', ')}
                                  </Typography>
                                </Box>
                              )}
                            </ListItem>
                            {index < expandedEmployeeData.additionalEmployees.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    </>
                  )}
                </>
              ) : (
                <List dense>
                  {employeePreview.map((employee, index) => (
                    <React.Fragment key={employee._id}>
                      <ListItem>
                        <ListItemIcon>
                          <PeopleIcon color="primary" />
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
              )}
            </Paper>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Survey links will be sent immediately to all listed employees. 
                Make sure the survey is ready for responses.
              </Typography>
            </Alert>
          </>
        );

      case 3:
        return (
          <>
            <Box textAlign="center" py={4}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Survey Links Sent Successfully!
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Survey links have been sent to {employeePreview.length} employees 
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
                  • <strong>Employees Notified:</strong> {employeePreview.length}
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
              onClick={() => setStep(2)}
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
