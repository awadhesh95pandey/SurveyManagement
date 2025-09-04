#!/usr/bin/env node

/**
 * Test Users Seeding Script
 * 
 * This script creates dummy users for testing department filtering
 * Usage: node scripts/seed-test-users.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');

const seedTestUsers = async () => {
  try {
    console.log('🚀 Starting test users seeding...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ManagementSurvey';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get all departments
    const departments = await Department.find({});
    if (departments.length === 0) {
      console.log('❌ No departments found. Please run department seeding first.');
      process.exit(1);
    }
    
    console.log(`📋 Found ${departments.length} departments`);
    
    // Create test users for each department
    const testUsers = [];
    
    // IT Department users
    const itDept = departments.find(d => d.name === 'Information Technology');
    if (itDept) {
      testUsers.push(
        {
          name: 'John Smith',
          email: 'john.smith@company.com',
          password: await bcrypt.hash('password123', 10),
          department: itDept._id,
          role: 'employee',
          position: 'Software Developer',
          employeeId: 'IT001',
          isActive: true
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@company.com',
          password: await bcrypt.hash('password123', 10),
          department: itDept._id,
          role: 'manager',
          position: 'IT Manager',
          employeeId: 'IT002',
          isActive: true
        },
        {
          name: 'Mike Wilson',
          email: 'mike.wilson@company.com',
          password: await bcrypt.hash('password123', 10),
          department: itDept._id,
          role: 'employee',
          position: 'DevOps Engineer',
          employeeId: 'IT003',
          isActive: true
        }
      );
    }
    
    // HR Department users
    const hrDept = departments.find(d => d.name === 'Human Resources');
    if (hrDept) {
      testUsers.push(
        {
          name: 'Emily Davis',
          email: 'emily.davis@company.com',
          password: await bcrypt.hash('password123', 10),
          department: hrDept._id,
          role: 'manager',
          position: 'HR Manager',
          employeeId: 'HR001',
          isActive: true
        },
        {
          name: 'David Brown',
          email: 'david.brown@company.com',
          password: await bcrypt.hash('password123', 10),
          department: hrDept._id,
          role: 'employee',
          position: 'HR Specialist',
          employeeId: 'HR002',
          isActive: true
        }
      );
    }
    
    // Finance Department users
    const financeDept = departments.find(d => d.name === 'Finance');
    if (financeDept) {
      testUsers.push(
        {
          name: 'Lisa Anderson',
          email: 'lisa.anderson@company.com',
          password: await bcrypt.hash('password123', 10),
          department: financeDept._id,
          role: 'employee',
          position: 'Financial Analyst',
          employeeId: 'FIN001',
          isActive: true
        },
        {
          name: 'Robert Taylor',
          email: 'robert.taylor@company.com',
          password: await bcrypt.hash('password123', 10),
          department: financeDept._id,
          role: 'manager',
          position: 'Finance Manager',
          employeeId: 'FIN002',
          isActive: true
        }
      );
    }
    
    // Marketing Department users
    const marketingDept = departments.find(d => d.name === 'Marketing');
    if (marketingDept) {
      testUsers.push(
        {
          name: 'Jennifer White',
          email: 'jennifer.white@company.com',
          password: await bcrypt.hash('password123', 10),
          department: marketingDept._id,
          role: 'employee',
          position: 'Marketing Specialist',
          employeeId: 'MKT001',
          isActive: true
        },
        {
          name: 'Chris Martinez',
          email: 'chris.martinez@company.com',
          password: await bcrypt.hash('password123', 10),
          department: marketingDept._id,
          role: 'employee',
          position: 'Digital Marketing Manager',
          employeeId: 'MKT002',
          isActive: true
        }
      );
    }
    
    // Sales Department users
    const salesDept = departments.find(d => d.name === 'Sales');
    if (salesDept) {
      testUsers.push(
        {
          name: 'Kevin Garcia',
          email: 'kevin.garcia@company.com',
          password: await bcrypt.hash('password123', 10),
          department: salesDept._id,
          role: 'employee',
          position: 'Sales Representative',
          employeeId: 'SAL001',
          isActive: true
        },
        {
          name: 'Amanda Rodriguez',
          email: 'amanda.rodriguez@company.com',
          password: await bcrypt.hash('password123', 10),
          department: salesDept._id,
          role: 'manager',
          position: 'Sales Manager',
          employeeId: 'SAL002',
          isActive: true
        }
      );
    }
    
    // Clear existing test users (optional)
    console.log('🧹 Clearing existing test users...');
    await User.deleteMany({ 
      email: { 
        $in: testUsers.map(u => u.email) 
      } 
    });
    
    // Insert test users
    console.log(`👥 Creating ${testUsers.length} test users...`);
    const createdUsers = await User.insertMany(testUsers);
    
    console.log('✅ Test users created successfully:');
    createdUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.position}`);
    });
    
    console.log('🎉 Test users seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Test users seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
    process.exit(0);
  }
};

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedTestUsers();
}

module.exports = { seedTestUsers };
