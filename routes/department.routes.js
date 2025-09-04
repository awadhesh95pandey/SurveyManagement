const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      active = 'true',
      includeEmployeeCount = 'false',
      includeManager = 'false',
      search = '',
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    let query = {};
    
    if (active === 'true') {
      query.isActive = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build populate options
    let populateOptions = [];
    
    if (includeManager === 'true') {
      populateOptions.push({
        path: 'managerId',
        select: 'name email position'
      });
    }

    if (includeEmployeeCount === 'true') {
      populateOptions.push({
        path: 'employeeCount'
      });
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let departmentsQuery = Department.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    if (populateOptions.length > 0) {
      populateOptions.forEach(option => {
        departmentsQuery = departmentsQuery.populate(option);
      });
    }

    const departments = await departmentsQuery;
    const total = await Department.countDocuments(query);

    res.status(200).json({
      success: true,
      count: departments.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching departments'
    });
  }
});

// @desc    Get department tree structure
// @route   GET /api/departments/tree
// @access  Private
router.get('/tree', protect, async (req, res) => {
  try {
    const departmentTree = await Department.getDepartmentTree();

    res.status(200).json({
      success: true,
      data: departmentTree
    });
  } catch (error) {
    console.error('Error fetching department tree:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching department tree'
    });
  }
});

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('managerId', 'name email position')
      .populate('parentDepartment', 'name code')
      .populate('createdBy', 'name email');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching department'
    });
  }
});

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      managerId,
      parentDepartment,
      budget,
      location
    } = req.body;

    // Check if department with same name or code exists
    const existingDept = await Department.findOne({
      $or: [
        { name: name },
        { code: code }
      ]
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
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

    // Validate parent department exists if provided
    if (parentDepartment) {
      const parent = await Department.findById(parentDepartment);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent department not found'
        });
      }
    }

    const department = await Department.create({
      name,
      code,
      description,
      managerId,
      parentDepartment,
      budget,
      location,
      createdBy: req.user.id
    });

    const populatedDepartment = await Department.findById(department._id)
      .populate('managerId', 'name email position')
      .populate('parentDepartment', 'name code')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedDepartment
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating department'
    });
  }
});

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const {
      name,
      code,
      description,
      managerId,
      parentDepartment,
      budget,
      location,
      isActive
    } = req.body;

    // Check if another department with same name or code exists
    if (name || code) {
      const existingDept = await Department.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(name ? [{ name }] : []),
          ...(code ? [{ code }] : [])
        ]
      });

      if (existingDept) {
        return res.status(400).json({
          success: false,
          message: 'Another department with this name or code already exists'
        });
      }
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

    // Validate parent department exists if provided
    if (parentDepartment) {
      const parent = await Department.findById(parentDepartment);
      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent department not found'
        });
      }

      // Prevent circular reference
      if (parentDepartment === req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Department cannot be its own parent'
        });
      }
    }

    department = await Department.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(code && { code }),
        ...(description !== undefined && { description }),
        ...(managerId !== undefined && { managerId }),
        ...(parentDepartment !== undefined && { parentDepartment }),
        ...(budget !== undefined && { budget }),
        ...(location !== undefined && { location }),
        ...(isActive !== undefined && { isActive })
      },
      {
        new: true,
        runValidators: true
      }
    )
    .populate('managerId', 'name email position')
    .populate('parentDepartment', 'name code')
    .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating department'
    });
  }
});

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has employees
    const employeeCount = await User.countDocuments({ 
      department: req.params.id,
      isActive: true 
    });

    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. It has ${employeeCount} active employees. Please reassign employees first.`
      });
    }

    // Check if department has subdepartments
    const subdepartmentCount = await Department.countDocuments({ 
      parentDepartment: req.params.id,
      isActive: true 
    });

    if (subdepartmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department. It has ${subdepartmentCount} active subdepartments. Please reassign subdepartments first.`
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting department'
    });
  }
});

// @desc    Get employees in a department
// @route   GET /api/departments/:id/employees
// @access  Private
router.get('/:id/employees', protect, async (req, res) => {
  try {
    const { 
      includeSubdepartments = 'false',
      role = '',
      search = '',
      page = 1,
      limit = 50
    } = req.query;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Build query
    let departmentIds = [req.params.id];

    // Include subdepartments if requested
    if (includeSubdepartments === 'true') {
      const subdepartments = await Department.find({ 
        parentDepartment: req.params.id,
        isActive: true 
      });
      departmentIds = departmentIds.concat(subdepartments.map(d => d._id));
    }

    let query = {
      department: { $in: departmentIds },
      isActive: true
    };

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

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const employees = await User.find(query)
      .populate('department', 'name code')
      .populate('managerId', 'name email')
      .select('-password')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

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
    console.error('Error fetching department employees:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching department employees'
    });
  }
});

module.exports = router;

