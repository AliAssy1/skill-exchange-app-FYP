const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
  let connection;
  
  try {
    // Connect without database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('📦 Initializing database...');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'skill_exchange'}`);
    console.log(`✅ Database '${process.env.DB_NAME || 'skill_exchange'}' created/verified`);

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'skill_exchange'}`);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('student', 'admin') DEFAULT 'student',
        major VARCHAR(255),
        year_of_study VARCHAR(50),
        bio TEXT,
        avatar_url VARCHAR(500),
        credits INT DEFAULT 100,
        reputation_score DECIMAL(3,2) DEFAULT 5.00,
        total_reviews INT DEFAULT 0,
        account_status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_status (account_status)
      )
    `);
    console.log('✅ Users table created');

    // Create skills table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        skill_name VARCHAR(255) NOT NULL,
        skill_type ENUM('offered', 'needed') NOT NULL,
        proficiency_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_skill_type (skill_type)
      )
    `);
    console.log('✅ Skills table created');

    // Create services table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        skill_required VARCHAR(255),
        credits_cost INT NOT NULL,
        duration_minutes INT,
        location VARCHAR(255),
        status ENUM('active', 'inactive', 'completed', 'cancelled') DEFAULT 'active',
        views_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_category (category)
      )
    `);
    console.log('✅ Services table created');

    // Create transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_id INT NOT NULL,
        requester_id INT NOT NULL,
        provider_id INT NOT NULL,
        credits_amount INT NOT NULL,
        status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed') DEFAULT 'pending',
        scheduled_date DATETIME,
        completion_date DATETIME,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_service_id (service_id),
        INDEX idx_requester_id (requester_id),
        INDEX idx_provider_id (provider_id),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ Transactions table created');

    // Create reviews table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        reviewee_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_transaction_id (transaction_id),
        INDEX idx_reviewee_id (reviewee_id),
        UNIQUE KEY unique_review (transaction_id, reviewer_id)
      )
    `);
    console.log('✅ Reviews table created');

    // Create messages table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_sender_id (sender_id),
        INDEX idx_receiver_id (receiver_id),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ Messages table created');

    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        link VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read)
      )
    `);
    console.log('✅ Notifications table created');

    // Create reports table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reporter_id INT NOT NULL,
        reported_user_id INT,
        reported_service_id INT,
        reason VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (reported_service_id) REFERENCES services(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_reporter_id (reporter_id)
      )
    `);
    console.log('✅ Reports table created');

    // Insert admin user
    const hashedPassword = await require('bcryptjs').hash('admin123', 10);
    await connection.query(`
      INSERT INTO users (email, password, full_name, role, major, credits, reputation_score)
      VALUES ('K2355109@KINGSTON.AC.UK', ?, 'Ali Assi', 'admin', 'Computer Science', 1000, 5.00)
      ON DUPLICATE KEY UPDATE email=email
    `, [hashedPassword]);
    console.log('✅ Admin user created (K2355109@KINGSTON.AC.UK / admin123)');

    console.log('\n🎉 Database initialization completed successfully!\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    if (require.main === module) process.exit(1);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run initialization if called directly, or export for use in server.js
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
