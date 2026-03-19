require('dotenv').config();
const mysql = require('mysql2/promise');

async function clearTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('🧹 Clearing database tables (keeping users)...\n');

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear tables in order (reviews first, then transactions, then services, skills)
    await connection.query('DELETE FROM reviews');
    console.log('✅ Cleared reviews table');
    
    await connection.query('DELETE FROM transactions');
    console.log('✅ Cleared transactions table');
    
    await connection.query('DELETE FROM messages');
    console.log('✅ Cleared messages table');
    
    await connection.query('DELETE FROM notifications');
    console.log('✅ Cleared notifications table');
    
    await connection.query('DELETE FROM services');
    console.log('✅ Cleared services table');
    
    await connection.query('DELETE FROM skills');
    console.log('✅ Cleared skills table');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n🎉 Tables cleared successfully! Users kept intact.\n');

  } catch (error) {
    console.error('❌ Error clearing tables:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

clearTables();
