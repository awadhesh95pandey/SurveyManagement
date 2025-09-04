const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  name: {
    type: String,
    required: [true, 'Please provide a name']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  department: {
    type: String,
    ref: 'Department',
    required: [true, 'Please provide a department']
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'manager'],
    default: 'employee'
  },
  managerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  directReports: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot be more than 100 characters']
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  // Check if password exists in the document
  if (!this.password) {
    return false;
  }
  
  // Check if enteredPassword is provided
  if (!enteredPassword) {
    return false;
  }
  
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get all direct reports
UserSchema.methods.getDirectReports = async function() {
  return await this.model('User').find({ managerId: this._id })
    .populate('department', 'name code')
    .select('-password');
};

// Get reporting hierarchy (all reports under this user)
UserSchema.methods.getReportingHierarchy = async function() {
  const User = this.model('User');
  const hierarchy = [];
  
  const getReports = async (managerId) => {
    const reports = await User.find({ managerId })
      .populate('department', 'name code')
      .select('-password');
    
    for (const report of reports) {
      hierarchy.push(report);
      await getReports(report._id);
    }
  };
  
  await getReports(this._id);
  return hierarchy;
};

// Get manager chain (all managers above this user)
UserSchema.methods.getManagerChain = async function() {
  const User = this.model('User');
  const chain = [];
  let currentUser = this;
  
  while (currentUser.managerId) {
    const manager = await User.findById(currentUser.managerId)
      .populate('department', 'name code')
      .select('-password');
    
    if (manager) {
      chain.push(manager);
      currentUser = manager;
    } else {
      break;
    }
  }
  
  return chain;
};

// Static method to get users by department
UserSchema.statics.getUsersByDepartment = async function(departmentId) {
  return await this.find({ 
    department: departmentId, 
    isActive: true 
  })
  .populate('department', 'name code')
  .populate('managerId', 'name email')
  .select('-password')
  .sort({ name: 1 });
};

// Static method to get department managers
UserSchema.statics.getDepartmentManagers = async function() {
  return await this.find({ 
    role: { $in: ['manager', 'admin'] },
    isActive: true 
  })
  .populate('department', 'name code')
  .select('-password')
  .sort({ name: 1 });
};

module.exports = mongoose.model('User', UserSchema);
