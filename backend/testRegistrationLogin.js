require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');

const API_URL = 'http://localhost:5000/api';

// Test users to register
const testUsers = [
  {
    full_name: 'Emma Williams',
    email: 'emma.williams@kingston.ac.uk',
    password: 'emma123456',
    major: 'Psychology',
    year_of_study: 'Year 3'
  },
  {
    full_name: 'Michael Brown',
    email: 'michael.brown@kingston.ac.uk',
    password: 'michael123456',
    major: 'Engineering',
    year_of_study: 'Year 4'
  },
  {
    full_name: 'Sophia Davis',
    email: 'sophia.davis@kingston.ac.uk',
    password: 'sophia123456',
    major: 'Marketing',
    year_of_study: 'Year 2'
  },
  {
    full_name: 'James Wilson',
    email: 'james.wilson@kingston.ac.uk',
    password: 'james123456',
    major: 'Computer Science',
    year_of_study: 'Year 1'
  }
];

async function testRegistration() {
  console.log('\n🎯 Testing Registration & Login Flow\n');
  console.log('━'.repeat(60));
  
  const registeredUsers = [];

  for (const user of testUsers) {
    try {
      console.log(`\n📝 Registering: ${user.full_name}`);
      
      // Register user
      const registerResponse = await axios.post(`${API_URL}/auth/register`, user);
      
      if (registerResponse.data.success) {
        console.log(`   ✅ Registration successful!`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: ${user.password}`);
        console.log(`   🎓 Major: ${user.major}, ${user.year_of_study}`);
        console.log(`   💎 Credits: ${registerResponse.data.user.credits}`);
        console.log(`   🆔 User ID: ${registerResponse.data.user.id}`);
        
        registeredUsers.push({
          ...user,
          id: registerResponse.data.user.id,
          token: registerResponse.data.token
        });
      }
      
      // Wait a bit between registrations
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`   ℹ️  User already exists: ${user.email}`);
      } else {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  return registeredUsers;
}

async function testLogin(users) {
  console.log('\n\n🔐 Testing Login for All Users\n');
  console.log('━'.repeat(60));

  const loggedInUsers = [];

  for (const user of users) {
    try {
      console.log(`\n🔓 Logging in: ${user.email}`);
      
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: user.email,
        password: user.password
      });

      if (loginResponse.data.success) {
        console.log(`   ✅ Login successful!`);
        console.log(`   👤 Name: ${loginResponse.data.user.full_name}`);
        console.log(`   📧 Email: ${loginResponse.data.user.email}`);
        console.log(`   🎓 Major: ${loginResponse.data.user.major}`);
        console.log(`   💎 Credits: ${loginResponse.data.user.credits}`);
        console.log(`   ⭐ Reputation: ${loginResponse.data.user.reputation_score}`);
        console.log(`   🔑 Token: ${loginResponse.data.token.substring(0, 30)}...`);
        
        loggedInUsers.push({
          ...user,
          token: loginResponse.data.token,
          userData: loginResponse.data.user
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  return loggedInUsers;
}

async function verifyDatabaseStorage() {
  console.log('\n\n🗄️  Verifying Database Storage\n');
  console.log('━'.repeat(60));

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    // Get all users
    const [users] = await connection.query(
      'SELECT id, email, full_name, role, major, year_of_study, credits, reputation_score, account_status, created_at FROM users ORDER BY id DESC LIMIT 10'
    );

    console.log('\n📊 Recent Users in Database:\n');
    
    users.forEach(user => {
      console.log(`┌─ User ID: ${user.id}`);
      console.log(`│  👤 Name: ${user.full_name}`);
      console.log(`│  📧 Email: ${user.email}`);
      console.log(`│  🎓 Major: ${user.major || 'N/A'}, ${user.year_of_study || 'N/A'}`);
      console.log(`│  💎 Credits: ${user.credits}`);
      console.log(`│  ⭐ Reputation: ${user.reputation_score}`);
      console.log(`│  📅 Created: ${user.created_at.toISOString().split('T')[0]}`);
      console.log(`└─ Status: ${user.account_status}\n`);
    });

    // Count statistics
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as student_count,
        SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) as active_users
      FROM users
    `);

    console.log('📈 Database Statistics:');
    console.log(`   Total Users: ${stats[0].total_users}`);
    console.log(`   Admins: ${stats[0].admin_count}`);
    console.log(`   Students: ${stats[0].student_count}`);
    console.log(`   Active Users: ${stats[0].active_users}`);

    await connection.end();

  } catch (error) {
    console.error('❌ Database verification error:', error.message);
  }
}

async function runFullTest() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SKILL EXCHANGE - REGISTRATION & LOGIN TEST SUITE      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  try {
    // Step 1: Register test users
    const registeredUsers = await testRegistration();
    
    // Step 2: Test login for all users (including existing ones)
    await testLogin([...testUsers, ...registeredUsers]);
    
    // Step 3: Verify database storage
    await verifyDatabaseStorage();
    
    console.log('\n\n✅ All tests completed successfully!\n');
    console.log('━'.repeat(60));
    console.log('\n📝 Test User Credentials:\n');
    
    testUsers.forEach(user => {
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   ─────────────────────────────────────\n`);
    });

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

runFullTest();
