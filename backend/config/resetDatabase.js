const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetDatabase = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      port:     process.env.DB_PORT     || 3306,
      database: process.env.DB_NAME     || 'skill_exchange',
    });

    console.log('🗑️  Resetting database...\n');

    // Disable foreign key checks so we can truncate in any order
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'verification_codes',
      'reports',
      'notifications',
      'messages',
      'reviews',
      'transactions',
      'services',
      'skills',
      'users',
    ];

    for (const table of tables) {
      try {
        await connection.query(`TRUNCATE TABLE ${table}`);
        console.log(`  ✅ Cleared: ${table}`);
      } catch {
        console.log(`  ⚠️  Skipped (table may not exist): ${table}`);
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // Re-create admin account
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      `INSERT INTO users (email, password, full_name, role, major, credits, reputation_score)
       VALUES ('K2355109@KINGSTON.AC.UK', ?, 'Ali Assi', 'admin', 'Computer Science', 1000, 5.00)`,
      [hashedPassword]
    );
    console.log('\n  ✅ Admin account recreated:');
    console.log('     Email:    K2355109@KINGSTON.AC.UK');
    console.log('     Password: admin123');

    // Demo student accounts — presentation only
    const hashedDemo = await bcrypt.hash('Password123', 10);
    await connection.query(
      `INSERT INTO users (email, password, full_name, role, credits, reputation_score)
       VALUES ('k1234567@kingston.ac.uk', ?, 'Demo Student One', 'student', 100, 0.00),
              ('k7654321@kingston.ac.uk', ?, 'Demo Student Two', 'student', 100, 0.00)`,
      [hashedDemo, hashedDemo]
    );
    console.log('\n  ✅ Demo student accounts created:');
    console.log('     Email: k1234567@kingston.ac.uk  Password: Password123');
    console.log('     Email: k7654321@kingston.ac.uk  Password: Password123\n');

    console.log('🎉 Database reset complete! All accounts cleared.\n');
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

resetDatabase();
