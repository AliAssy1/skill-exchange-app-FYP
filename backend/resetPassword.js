require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function resetPassword() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('🔐 Resetting password for test.user2@kingston.ac.uk...\n');

    // Hash the new password
    const newPassword = 'test123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const [result] = await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'test.user2@kingston.ac.uk']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Password reset successfully!');
      console.log('\n📧 Email: test.user2@kingston.ac.uk');
      console.log('🔑 Password: test123456');
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetPassword();
