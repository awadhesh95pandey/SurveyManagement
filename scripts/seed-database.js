#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script can be run manually to seed the database with initial data.
 * Usage: node scripts/seed-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { runSeeders } = require('../seeders');

const seedDatabase = async () => {
  try {
    console.log('🚀 Starting manual database seeding...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ManagementSurvey';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Run seeders
    await runSeeders();
    
    console.log('🎉 Manual seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Manual seeding failed:', error);
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
  seedDatabase();
}

module.exports = { seedDatabase };
