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
    
    // If no admin user exists, create a default one
    if (!adminUser) {
      console.log('👤 No admin user found. Creating default admin...');
      adminUser = await User.create({
        name: 'System Administrator',
        email: 'admin@company.com',
        password: 'admin123', // This will be hashed by the User model
        role: 'admin',
        department: null, // Will be set after HR department is created
        isActive: true
      });
      console.log('✅ Default admin user created');
    }

    // Create departments
    const createdDepartments = [];
    for (const deptData of defaultDepartments) {
      const department = await Department.create({
        ...deptData,
        createdBy: adminUser._id,
        isActive: true
      });
      createdDepartments.push(department);
      console.log(`✅ Created department: ${department.name} (${department.code})`);
    }

    // If we created a default admin and HR department exists, assign admin to HR
    if (adminUser.email === 'admin@company.com') {
      const hrDepartment = createdDepartments.find(dept => dept.code === 'HR');
      if (hrDepartment) {
        await User.findByIdAndUpdate(adminUser._id, { 
          department: hrDepartment._id 
        });
        console.log('✅ Assigned admin user to HR department');
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
