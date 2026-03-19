// Quick Database Viewer Script
require('dotenv').config();
const mysql = require('mysql2/promise');

async function viewDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('✅ Connected to MySQL Database\n');

    // View Users
    console.log('═══════════════════════════════════════════════════════════');
    console.log('👥 USERS TABLE');
    console.log('═══════════════════════════════════════════════════════════');
    const [users] = await connection.execute('SELECT * FROM users');
    console.table(users);

    // View Services
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🛠️  SERVICES TABLE');
    console.log('═══════════════════════════════════════════════════════════');
    const [services] = await connection.execute('SELECT * FROM services');
    if (services.length > 0) {
      console.table(services);
    } else {
      console.log('No services yet.');
    }

    // View Skills
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💡 SKILLS TABLE');
    console.log('═══════════════════════════════════════════════════════════');
    const [skills] = await connection.execute('SELECT * FROM skills');
    if (skills.length > 0) {
      console.table(skills);
    } else {
      console.log('No skills yet.');
    }

    // View Transactions
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💰 TRANSACTIONS TABLE');
    console.log('═══════════════════════════════════════════════════════════');
    const [transactions] = await connection.execute('SELECT * FROM transactions');
    if (transactions.length > 0) {
      console.table(transactions);
    } else {
      console.log('No transactions yet.');
    }

    // View Reviews
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('⭐ REVIEWS TABLE');
    console.log('═══════════════════════════════════════════════════════════');
    const [reviews] = await connection.execute('SELECT * FROM reviews');
    if (reviews.length > 0) {
      console.table(reviews);
    } else {
      console.log('No reviews yet.');
    }

    // View Messages
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💬 MESSAGES TABLE');
    console.log('═══════════════════════════════════════════════════════════');
    const [messages] = await connection.execute('SELECT * FROM messages');
    if (messages.length > 0) {
      console.table(messages);
    } else {
      console.log('No messages yet.');
    }

    // View Notifications
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔔 NOTIFICATIONS TABLE');
    console.log('═══════════════════════════════════════════════════════════');
    const [notifications] = await connection.execute('SELECT * FROM notifications');
    if (notifications.length > 0) {
      console.table(notifications);
    } else {
      console.log('No notifications yet.');
    }

    // View Reports
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🚨 REPORTS TABLE');
    console.log('═══════════════════════════════════════════════════════════');
    const [reports] = await connection.execute('SELECT * FROM reports');
    if (reports.length > 0) {
      console.table(reports);
    } else {
      console.log('No reports yet.');
    }

    // Database Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 DATABASE SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Users: ${users.length}`);
    console.log(`Services: ${services.length}`);
    console.log(`Skills: ${skills.length}`);
    console.log(`Transactions: ${transactions.length}`);
    console.log(`Reviews: ${reviews.length}`);
    console.log(`Messages: ${messages.length}`);
    console.log(`Notifications: ${notifications.length}`);
    console.log(`Reports: ${reports.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

viewDatabase();
