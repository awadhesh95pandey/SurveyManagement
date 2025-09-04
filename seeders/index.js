const { seedDepartments } = require('./departmentSeeder');

const runSeeders = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Run department seeder
    await seedDepartments();
    
    // Add more seeders here in the future
    // await seedUsers();
    // await seedSurveys();
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

module.exports = { runSeeders };
