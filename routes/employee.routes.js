const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const xlsx = require('xlsx');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      department = '',
      role = '',
      active = 'true',
      search = '',
      page = 1,
      limit = 50,
      includeManager = 'false',
      includeDepartment = 'true'
    } = req.query;

    // Build query
    let query = {};
    
    if (active === 'true') {
      query.isActive = true;
    }

    if (department) {
      // If department is provided, find the department by name and use its ID
      const departmentDoc = await Department.findOne({ name: department });
      if (departmentDoc) {
        query.department = departmentDoc._id;
      } else {
        // If department not found, return empty result
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            pages: 0
          },
          data: []
        });
      }
    }

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    // Build populate options
    let populateOptions = [];
    
    if (includeDepartment === 'true') {
      populateOptions.push({
        path: 'department',
        select: 'name code'
      });
    }

    if (includeManager === 'true') {
      populateOptions.push({
        path: 'managerId',
        select: 'name email position'
      });
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let employeesQuery = User.find(query)
      .select('-password')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (populateOptions.length > 0) {
      populateOptions.forEach(option => {
        employeesQuery = employeesQuery.populate(option);
      });
    }

    const employees = await employeesQuery;
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employees'
    });
  }
});

// @desc    Get employees by department
// @route   GET /api/employees/by-department/:departmentId
// @access  Private
router.get('/by-department/:departmentId', protect, async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { 
      includeSubdepartments = 'false',
      role = '',
      active = 'true'
    } = req.query;

    // Validate department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    let departmentIds = [departmentId];

    // Include subdepartments if requested
    if (includeSubdepartments === 'true') {
      const subdepartments = await Department.find({ 
        parentDepartment: departmentId,
        isActive: true 
      });
      departmentIds = departmentIds.concat(subdepartments.map(d => d._id.toString()));
    }

    // Build query
    let query = {
      department: { $in: departmentIds }
    };

    if (active === 'true') {
      query.isActive = true;
    }

    if (role) {
      query.role = role;
    }

    const employees = await User.find(query)
      .populate('department', 'name code')
      .populate('managerId', 'name email')
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees by department:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employees by department'
    });
  }
});

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .populate('department', 'name code description')
      .populate('managerId', 'name email position')
      .populate('directReports', 'name email position')
      .select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employee'
    });
  }
});

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin/Manager only)
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      department,
      role,
      managerId,
      position,
      employeeId,
      phoneNumber,
      joinDate
    } = req.body;

    // Check if user with same email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if employeeId is unique if provided
    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Validate department exists
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Validate manager exists if provided
    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Manager not found'
        });
      }
    }

    const employee = await User.create({
      name,
      email,
      password,
      department,
      role: role || 'employee',
      managerId,
      position,
      employeeId,
      phoneNumber,
      joinDate: joinDate || new Date()
    });

    // Update manager's direct reports
    if (managerId) {
      await User.findByIdAndUpdate(
        managerId,
        { $addToSet: { directReports: employee._id } }
      );
    }

    const populatedEmployee = await User.findById(employee._id)
      .populate('department', 'name code')
      .populate('managerId', 'name email')
      .select('-password');

    res.status(201).json({
      success: true,
      data: populatedEmployee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating employee'
    });
  }
});

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin/Manager only)
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    let employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const {
      name,
      email,
      department,
      role,
      managerId,
      position,
      employeeId,
      phoneNumber,
      isActive,
      joinDate
    } = req.body;

    // Check if another user with same email exists
    if (email && email !== employee.email) {
      const existingUser = await User.findOne({ 
        email,
        _id: { $ne: req.params.id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Another user with this email already exists'
        });
      }
    }

    // Check if employeeId is unique if provided
    if (employeeId && employeeId !== employee.employeeId) {
      const existingEmployee = await User.findOne({ 
        employeeId,
        _id: { $ne: req.params.id }
      });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Validate department exists if provided
    if (department) {
      const departmentDoc = await Department.findById(department);
      if (!departmentDoc) {
        return res.status(400).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Handle manager change
    if (managerId !== undefined) {
      // Remove from old manager's direct reports
      if (employee.managerId) {
        await User.findByIdAndUpdate(
          employee.managerId,
          { $pull: { directReports: employee._id } }
        );
      }

      // Add to new manager's direct reports
      if (managerId) {
        const manager = await User.findById(managerId);
        if (!manager) {
          return res.status(400).json({
            success: false,
            message: 'Manager not found'
          });
        }

        await User.findByIdAndUpdate(
          managerId,
          { $addToSet: { directReports: employee._id } }
        );
      }
    }

    employee = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(department && { department }),
        ...(role && { role }),
        ...(managerId !== undefined && { managerId }),
        ...(position !== undefined && { position }),
        ...(employeeId !== undefined && { employeeId }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(isActive !== undefined && { isActive }),
        ...(joinDate && { joinDate })
      },
      {
        new: true,
        runValidators: true
      }
    )
    .populate('department', 'name code')
    .populate('managerId', 'name email')
    .select('-password');

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating employee'
    });
  }
});

// @desc    Delete employee (soft delete)
// @route   DELETE /api/employees/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employee has direct reports
    const directReportsCount = await User.countDocuments({ 
      managerId: req.params.id,
      isActive: true 
    });

    if (directReportsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete employee. They have ${directReportsCount} direct reports. Please reassign reports first.`
      });
    }

    // Soft delete - set isActive to false
    await User.findByIdAndUpdate(req.params.id, { isActive: false });

    // Remove from manager's direct reports
    if (employee.managerId) {
      await User.findByIdAndUpdate(
        employee.managerId,
        { $pull: { directReports: employee._id } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting employee'
    });
  }
});

// @desc    Get employee's direct reports
// @route   GET /api/employees/:id/direct-reports
// @access  Private
router.get('/:id/direct-reports', protect, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const directReports = await employee.getDirectReports();

    res.status(200).json({
      success: true,
      count: directReports.length,
      data: directReports
    });
  } catch (error) {
    console.error('Error fetching direct reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching direct reports'
    });
  }
});

// @desc    Get employee's reporting hierarchy
// @route   GET /api/employees/:id/hierarchy
// @access  Private
router.get('/:id/hierarchy', protect, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const hierarchy = await employee.getReportingHierarchy();

    res.status(200).json({
      success: true,
      count: hierarchy.length,
      data: hierarchy
    });
  } catch (error) {
    console.error('Error fetching reporting hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reporting hierarchy'
    });
  }
});

// @desc    Get employee's manager chain
// @route   GET /api/employees/:id/manager-chain
// @access  Private
router.get('/:id/manager-chain', protect, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const managerChain = await employee.getManagerChain();

    res.status(200).json({
      success: true,
      count: managerChain.length,
      data: managerChain
    });
  } catch (error) {
    console.error('Error fetching manager chain:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching manager chain'
    });
  }
});

// @desc    Get managers for dropdown
// @route   GET /api/employees/managers
// @access  Private
router.get('/managers/list', protect, async (req, res) => {
  try {
    const { department = '' } = req.query;

    let query = {
      role: { $in: ['manager', 'admin'] },
      isActive: true
    };

    if (department) {
      // If department is provided, find the department by name and use its ID
      const departmentDoc = await Department.findOne({ name: department });
      if (departmentDoc) {
        query.department = departmentDoc._id;
      } else {
        // If department not found, return empty result
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    }

    const managers = await User.find(query)
      .populate('department', 'name code')
      .select('name email position department')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: managers.length,
      data: managers
    });
  } catch (error) {
    console.error('Error fetching managers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching managers'
    });
  }
});

// @desc    Import employees from CSV/Excel file
// @route   POST /api/employees/import
// @access  Private (Admin only)
router.post('/import', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Parse the uploaded file
    let data;
    try {
      if (req.file.mimetype === 'text/csv') {
        // Parse CSV
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = xlsx.utils.sheet_to_json(worksheet);
      } else {
        // Parse Excel
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = xlsx.utils.sheet_to_json(worksheet);
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse file. Please ensure it is a valid CSV or Excel file.'
      });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File is empty or contains no valid data'
      });
    }

    // Validate required columns
    const requiredColumns = ['Name', 'Email', 'Department', 'Role'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`
      });
    }

    // Process employees data
    const results = await processEmployeeData(data);

    res.status(200).json({
      success: true,
      message: `Successfully processed ${results.successful} employees`,
      data: {
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        employees: results.employees
      }
    });

  } catch (error) {
    console.error('Error importing employees:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while importing employees'
    });
  }
});

// @desc    Download sample employee template
// @route   GET /api/employees/sample-template
// @access  Private (Admin only)
router.get('/sample-template', protect, authorize('admin'), async (req, res) => {
  try {
    const format = req.query.format || 'xlsx';
    
    if (format === 'csv') {
      // Create CSV sample
      const csvContent = 'Name,Email,Department,Role,Position,Employee ID,Phone Number,Manager Email\n' +
                         'John Doe,john.doe@company.com,Engineering,employee,Software Developer,EMP001,+1234567890,manager@company.com\n' +
                         'Jane Smith,jane.smith@company.com,Marketing,employee,Marketing Specialist,EMP002,+1234567891,manager@company.com\n' +
                         'Mike Johnson,mike.johnson@company.com,HR,manager,HR Manager,EMP003,+1234567892,';
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="sample_employees.csv"');
      res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
      
      return res.status(200).send(csvContent);
    } else {
      // Create Excel sample
      const workbook = xlsx.utils.book_new();
      
      const data = [
        { 
          Name: 'John Doe', 
          Email: 'john.doe@company.com', 
          Department: 'Engineering', 
          Role: 'employee', 
          Position: 'Software Developer', 
          'Employee ID': 'EMP001', 
          'Phone Number': '+1234567890', 
          'Manager Email': 'manager@company.com' 
        },
        { 
          Name: 'Jane Smith', 
          Email: 'jane.smith@company.com', 
          Department: 'Marketing', 
          Role: 'employee', 
          Position: 'Marketing Specialist', 
          'Employee ID': 'EMP002', 
          'Phone Number': '+1234567891', 
          'Manager Email': 'manager@company.com' 
        },
        { 
          Name: 'Mike Johnson', 
          Email: 'mike.johnson@company.com', 
          Department: 'HR', 
          Role: 'manager', 
          Position: 'HR Manager', 
          'Employee ID': 'EMP003', 
          'Phone Number': '+1234567892', 
          'Manager Email': '' 
        }
      ];
      
      const worksheet = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Employees');
      
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="sample_employees.xlsx"');
      res.setHeader('Content-Length', buffer.length);
      
      return res.status(200).send(buffer);
    }
  } catch (error) {
    console.error('Error generating sample template:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating sample template'
    });
  }
});

// Helper function to process employee data from file
async function processEmployeeData(data) {
  const results = {
    successful: 0,
    failed: 0,
    errors: [],
    employees: []
  };

  // Get all departments for validation
  const departments = await Department.find({ isActive: true });
  const departmentMap = new Map();
  departments.forEach(dept => {
    departmentMap.set(dept.name.toLowerCase(), dept._id);
  });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 1;

    try {
      // Validate required fields
      if (!row.Name || !row.Name.trim()) {
        results.errors.push(`Row ${rowNumber}: Name is required`);
        results.failed++;
        continue;
      }

      if (!row.Email || !row.Email.trim()) {
        results.errors.push(`Row ${rowNumber}: Email is required`);
        results.failed++;
        continue;
      }

      if (!row.Department || !row.Department.trim()) {
        results.errors.push(`Row ${rowNumber}: Department is required`);
        results.failed++;
        continue;
      }

      if (!row.Role || !row.Role.trim()) {
        results.errors.push(`Row ${rowNumber}: Role is required`);
        results.failed++;
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.Email.trim())) {
        results.errors.push(`Row ${rowNumber}: Invalid email format`);
        results.failed++;
        continue;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: row.Email.trim().toLowerCase() });
      if (existingUser) {
        results.errors.push(`Row ${rowNumber}: User with email ${row.Email} already exists`);
        results.failed++;
        continue;
      }

      // Check if employee ID already exists (if provided)
      if (row['Employee ID'] && row['Employee ID'].trim()) {
        const existingEmployee = await User.findOne({ employeeId: row['Employee ID'].trim() });
        if (existingEmployee) {
          results.errors.push(`Row ${rowNumber}: Employee ID ${row['Employee ID']} already exists`);
          results.failed++;
          continue;
        }
      }

      // Validate department
      const departmentId = departmentMap.get(row.Department.trim().toLowerCase());
      if (!departmentId) {
        results.errors.push(`Row ${rowNumber}: Department '${row.Department}' not found`);
        results.failed++;
        continue;
      }

      // Validate role
      const validRoles = ['admin', 'manager', 'employee'];
      if (!validRoles.includes(row.Role.trim().toLowerCase())) {
        results.errors.push(`Row ${rowNumber}: Invalid role '${row.Role}'. Must be one of: ${validRoles.join(', ')}`);
        results.failed++;
        continue;
      }

      // Find manager if provided
      let managerId = null;
      if (row['Manager Email'] && row['Manager Email'].trim()) {
        const manager = await User.findOne({ email: row['Manager Email'].trim().toLowerCase() });
        if (!manager) {
          results.errors.push(`Row ${rowNumber}: Manager with email '${row['Manager Email']}' not found`);
          results.failed++;
          continue;
        }
        managerId = manager._id;
      }

      // Create employee
      const employeeData = {
        name: row.Name.trim(),
        email: row.Email.trim().toLowerCase(),
        password: 'TempPassword123!', // Temporary password - should be changed on first login
        department: departmentId,
        role: row.Role.trim().toLowerCase(),
        position: row.Position ? row.Position.trim() : '',
        employeeId: row['Employee ID'] ? row['Employee ID'].trim() : '',
        phoneNumber: row['Phone Number'] ? row['Phone Number'].trim() : '',
        managerId: managerId,
        joinDate: new Date()
      };

      const employee = await User.create(employeeData);

      // Update manager's direct reports if manager exists
      if (managerId) {
        await User.findByIdAndUpdate(
          managerId,
          { $addToSet: { directReports: employee._id } }
        );
      }

      // Populate the created employee for response
      const populatedEmployee = await User.findById(employee._id)
        .populate('department', 'name code')
        .populate('managerId', 'name email')
        .select('-password');

      results.employees.push(populatedEmployee);
      results.successful++;

    } catch (error) {
      console.error(`Error processing row ${rowNumber}:`, error);
      results.errors.push(`Row ${rowNumber}: ${error.message}`);
      results.failed++;
    }
  }

  return results;
}

module.exports = router;
