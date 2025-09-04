# Database Seeders

This directory contains database seeding scripts that populate your MongoDB database with initial data.

## 🌱 What Gets Seeded

### Departments
The system automatically creates 10 common departments:

1. **Human Resources (HR)** - Employee management, recruitment, and HR policies
2. **Information Technology (IT)** - Technology infrastructure, software development, and IT support
3. **Finance (FIN)** - Financial planning, accounting, and budget management
4. **Marketing (MKT)** - Marketing campaigns, brand management, and customer outreach
5. **Operations (OPS)** - Daily operations, process management, and logistics
6. **Sales (SAL)** - Sales operations, customer relations, and revenue generation
7. **Research & Development (RND)** - Product research, innovation, and development projects
8. **Customer Support (CS)** - Customer service, technical support, and client relations
9. **Quality Assurance (QA)** - Quality control, testing, and compliance management
10. **Legal (LEG)** - Legal compliance, contracts, and regulatory affairs

### Admin User
If no admin user exists, the system creates a default admin:
- **Email**: admin@company.com
- **Password**: admin123
- **Role**: admin
- **Department**: HR (Human Resources)

## 🚀 How Seeding Works

### Automatic Seeding
Seeders run automatically when:
- The server starts (`npm start` or `npm run dev`)
- The database connection is established
- No existing departments are found

### Manual Seeding
You can also run seeders manually:

```bash
# Run all seeders
npm run seed

# Run only department seeder
npm run seed:departments

# Run the standalone script
node scripts/seed-database.js
```

## 🔧 Customization

### Adding More Departments
Edit `seeders/departmentSeeder.js` and modify the `defaultDepartments` array:

```javascript
const defaultDepartments = [
  {
    name: "Your Department Name",
    code: "DEPT", // Unique code (uppercase)
    description: "Department description",
    location: "Building X, Floor Y" // Optional
  },
  // ... more departments
];
```

### Adding New Seeders
1. Create a new seeder file in the `seeders/` directory
2. Export a seeding function
3. Import and call it in `seeders/index.js`

Example:
```javascript
// seeders/userSeeder.js
const seedUsers = async () => {
  // Your seeding logic here
};

module.exports = { seedUsers };
```

```javascript
// seeders/index.js
const { seedDepartments } = require('./departmentSeeder');
const { seedUsers } = require('./userSeeder');

const runSeeders = async () => {
  await seedDepartments();
  await seedUsers(); // Add your new seeder
};
```

## 📝 Important Notes

- **Idempotent**: Seeders check if data already exists before creating new records
- **Safe**: Won't duplicate data if run multiple times
- **Automatic**: Runs on server startup if database is empty
- **Flexible**: Can be run manually anytime

## 🛠️ Troubleshooting

### Seeding Fails
- Check MongoDB connection
- Ensure proper permissions
- Check console logs for specific errors

### Reset Database
To completely reset and re-seed:
```bash
# Drop the database (be careful!)
mongo ManagementSurvey --eval "db.dropDatabase()"

# Restart server to trigger automatic seeding
npm run dev
```

### Manual Admin Creation
If you need to create an admin user manually:
```javascript
const User = require('./models/User');

const createAdmin = async () => {
  await User.create({
    name: 'Your Admin Name',
    email: 'your-admin@company.com',
    password: 'your-secure-password',
    role: 'admin',
    isActive: true
  });
};
```
