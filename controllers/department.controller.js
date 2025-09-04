const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('managerId', 'name email')
      .populate('parentDepartment', 'name code')
      .populate('employeeCount')
      .sort({ name: 1 });

    // Add employee count to each department
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await User.countDocuments({ department: dept._id });
        return {
          ...dept.toObject(),
          employeeCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: departmentsWithCount.length,
      data: departmentsWithCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('managerId', 'name email')
      .populate('parentDepartment', 'name code')
      .populate('subdepartments');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: `Department not found with id of ${req.params.id}`
      });
    }

    // Get employee count
    const employeeCount = await User.countDocuments({ department: department._id });

    res.status(200).json({
      success: true,
      data: {
        ...department.toObject(),
        employeeCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get department employees
// @route   GET /api/departments/:id/employees
// @access  Private
exports.getDepartmentEmployees = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: `Department not found with id of ${req.params.id}`
      });
    }

    const employees = await User.find({ department: req.params.id })
      .select('-password')
      .populate('department', 'name code')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin only)
exports.createDepartment = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    const department = await Department.create(req.body);

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin only)
exports.updateDepartment = async (req, res, next) => {
  try {
    let department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: `Department not found with id of ${req.params.id}`
      });
    }

    // Make sure user is department creator or admin
    if (department.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this department`
      });
    }

    department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: `Department not found with id of ${req.params.id}`
      });
    }

    // Make sure user is department creator or admin
    if (department.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this department`
      });
    }

    // Check if department has employees
    const employeeCount = await User.countDocuments({ department: req.params.id });
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with existing employees. Please reassign employees first.'
      });
    }

    // Check if department has subdepartments
    const subdepartmentCount = await Department.countDocuments({ parentDepartment: req.params.id });
    if (subdepartmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with existing subdepartments. Please reassign subdepartments first.'
      });
    }

    await department.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get department tree structure
// @route   GET /api/departments/tree
// @access  Private
exports.getDepartmentTree = async (req, res, next) => {
  try {
    const departmentTree = await Department.getDepartmentTree();

    res.status(200).json({
      success: true,
      data: departmentTree
    });
  } catch (err) {
    next(err);
  }
};
