const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');

const defaultDepartments = [
  {
    name: "Human Resources",
    code: "HR",
    description: "Employee management, recruitment, and HR policies",
    location: "Building A, Floor 2"
  },
  {
    name: "Information Technology",
    code: "IT", 
    description: "Technology infrastructure, software development, and IT support",
    location: "Building B, Floor 3"
  },
  {
    name: "Finance",
    code: "FIN",
    description: "Financial planning, accounting, and budget management",
    location: "Building A, Floor 1"
  },
  {
    name: "Marketing",
    code: "MKT",
    description: "Marketing campaigns, brand management, and customer outreach",
    location: "Building C, Floor 2"
  },
  {
    name: "Operations",
    code: "OPS",
    description: "Daily operations, process management, and logistics",
    location: "Building B, Floor 1"
  },
  {
    name: "Sales",
    code: "SAL",
    description: "Sales operations, customer relations, and revenue generation",
    location: "Building C, Floor 1"
  },
  {
    name: "Research & Development",
    code: "RND",
    description: "Product research, innovation, and development projects",
    location: "Building D, Floor 2"
  },
  {
    name: "Customer Support",
    code: "CS",
    description: "Customer service, technical support, and client relations",
    location: "Building B, Floor 2"
  },
  {
    name: "Quality Assurance",
    code: "QA",
    description: "Quality control, testing, and compliance management",
    location: "Building D, Floor 1"
  },
  {
    name: "Legal",
    code: "LEG",
    description: "Legal compliance, contracts, and regulatory affairs",
    location: "Building A, Floor 3"
  }
];

const seedDepartments = async () => {
  try {
    console.log('🏢 Checking departments...');
    
    // Check if departments already exist
    const existingDepartments = await Department.countDocuments();
    
    if (existingDepartments > 0) {
      console.log(`✅ Departments already exist (${existingDepartments} found). Skipping seeding.`);
      return;
    }

    console.log('🌱 Seeding departments...');

    // Find an admin user to set as creator
    let adminUser = await User.findOne({ role: 'admin' });
    let isNewAdmin = false;
    
    // If no admin user exists, we'll create one after creating HR department
    if (!adminUser) {
      console.log('👤 No admin user found. Will create after HR department...');
    }

    // Create departments first
    const createdDepartments = [];
    let hrDepartment = null;
    
    for (const deptData of defaultDepartments) {
      // For the first department (HR), create it without createdBy if no admin exists
      if (!adminUser && deptData.code === 'HR') {
        // Create HR department with a temporary createdBy that we'll update later
        hrDepartment = await Department.create({
          ...deptData,
          createdBy: new mongoose.Types.ObjectId(), // Temporary ObjectId
          isActive: true
        });
        createdDepartments.push(hrDepartment);
        console.log(`✅ Created department: ${hrDepartment.name} (${hrDepartment.code})`);
        
        // Now create the admin user with HR department
        adminUser = await User.create({
          name: 'System Administrator',
          email: 'dotnetdev12@paisalo.in',
          password: 'Awadhesh@123', // This will be hashed by the User model
          role: 'admin',
          department: hrDepartment._id,
          isActive: true
        });
        isNewAdmin = true;
        console.log('✅ Default admin user created and assigned to HR');
        
        // Update HR department to have correct createdBy
        await Department.findByIdAndUpdate(hrDepartment._id, {
          createdBy: adminUser._id
        });
        console.log('✅ Updated HR department createdBy field');
      } else {
        // Create other departments normally
        const department = await Department.create({
          ...deptData,
          createdBy: adminUser._id,
          isActive: true
        });
        createdDepartments.push(department);
        console.log(`✅ Created department: ${department.name} (${department.code})`);
      }
    }

    console.log(`🎉 Successfully seeded ${createdDepartments.length} departments!`);
    
    return createdDepartments;
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
    throw error;
  }
};

module.exports = { seedDepartments, defaultDepartments };
