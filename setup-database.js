#!/usr/bin/env node

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Kurban Database Setup Script');
console.log('================================\n');

// Check if required environment variables exist
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file and try again.');
  process.exit(1);
}

// Check if database password is set
if (!process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD === 'your-database-password') {
  console.log('⚠️  Database password not configured!');
  console.log('\nTo get your database password:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Settings > Database');
  console.log('3. Find the "Database password" section');
  console.log('4. Copy your database password');
  console.log('5. Update your .env file with: SUPABASE_DB_PASSWORD=your_actual_password');
  console.log('\nAlternatively, you can reset your database password from the dashboard.');
  console.log('\n📖 More info: https://supabase.com/docs/guides/database/connecting-to-postgres');

  console.log('\n⏭️  Continuing with Supabase API setup only...\n');
} else {
  console.log('✅ Database password configured');

  try {
    console.log('🔄 Running database migrations...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    console.log('✅ Migrations completed successfully');

    console.log('🔄 Running database seeders...');
    execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });
    console.log('✅ Seeders completed successfully');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 This might be due to:');
    console.log('   - Incorrect database password');
    console.log('   - Network connectivity issues');
    console.log('   - Database permissions');
    console.log('\n⏭️  Continuing with Supabase API setup...\n');
  }
}

console.log('🎉 Setup completed!');
console.log('\nNext steps:');
console.log('1. Start the development server: npm run dev');
console.log('2. The app will work with Supabase API even if Sequelize connection fails');
console.log('3. Configure your database password to enable full Sequelize features');

console.log('\n📚 Documentation:');
console.log('   - Supabase Database: https://supabase.com/docs/guides/database');
console.log('   - Sequelize: https://sequelize.org/docs/v6/');

console.log('\n🔗 Your Supabase project: ' + process.env.SUPABASE_URL);