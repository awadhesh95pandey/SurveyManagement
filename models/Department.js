const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a department name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Department name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please provide a department code'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [10, 'Department code cannot be more than 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  managerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  parentDepartment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Department',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  budget: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
DepartmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for employee count
DepartmentSchema.virtual('employeeCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department',
  count: true
});

// Virtual for subdepartments
DepartmentSchema.virtual('subdepartments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parentDepartment'
});

// Method to get all employees in this department
DepartmentSchema.methods.getEmployees = async function() {
  const User = mongoose.model('User');
  return await User.find({ department: this._id }).select('-password');
};

// Method to get department hierarchy
DepartmentSchema.methods.getHierarchy = async function() {
  const Department = mongoose.model('Department');
  const hierarchy = [];
  let current = this;
  
  while (current) {
    hierarchy.unshift({
      _id: current._id,
      name: current.name,
      code: current.code
    });
    
    if (current.parentDepartment) {
      current = await Department.findById(current.parentDepartment);
    } else {
      current = null;
    }
  }
  
  return hierarchy;
};

// Static method to get department tree
DepartmentSchema.statics.getDepartmentTree = async function() {
  const departments = await this.find({ isActive: true })
    .populate('managerId', 'name email')
    .populate('parentDepartment', 'name code')
    .sort({ name: 1 });

  // Build tree structure
  const departmentMap = {};
  const rootDepartments = [];

  // First pass: create map of all departments
  departments.forEach(dept => {
    departmentMap[dept._id] = {
      ...dept.toObject(),
      children: []
    };
  });

  // Second pass: build tree structure
  departments.forEach(dept => {
    if (dept.parentDepartment) {
      const parent = departmentMap[dept.parentDepartment._id];
      if (parent) {
        parent.children.push(departmentMap[dept._id]);
      }
    } else {
      rootDepartments.push(departmentMap[dept._id]);
    }
  });

  return rootDepartments;
};

// Ensure virtual fields are serialized
DepartmentSchema.set('toJSON', { virtuals: true });
DepartmentSchema.set('toObject', { virtuals: true });

// Index for efficient querying
DepartmentSchema.index({ name: 1 });
DepartmentSchema.index({ code: 1 });
DepartmentSchema.index({ isActive: 1 });
DepartmentSchema.index({ parentDepartment: 1 });

module.exports = mongoose.model('Department', DepartmentSchema);

