require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seedDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('📦 Starting database seeding...\n');

    // Get existing users
    const [existingUsers] = await connection.query('SELECT id, email, role FROM users');
    
    // Add 2 more test users if not exist
    const testUsers = [
      {
        email: 'sarah.johnson@kingston.ac.uk',
        password: 'student123',
        full_name: 'Sarah Johnson',
        major: 'Computer Science',
        year_of_study: 'Year 3',
        bio: 'Love teaching programming and web development'
      },
      {
        email: 'john.smith@kingston.ac.uk',
        password: 'student123',
        full_name: 'John Smith',
        major: 'Business Administration',
        year_of_study: 'Year 2',
        bio: 'Interested in marketing and graphic design'
      }
    ];

    let userIds = [];
    
    for (const user of testUsers) {
      const [check] = await connection.query('SELECT id FROM users WHERE email = ?', [user.email]);
      
      if (check.length === 0) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const [result] = await connection.query(
          'INSERT INTO users (email, password, full_name, major, year_of_study, bio) VALUES (?, ?, ?, ?, ?, ?)',
          [user.email, hashedPassword, user.full_name, user.major, user.year_of_study, user.bio]
        );
        userIds.push(result.insertId);
        console.log(`✅ Created user: ${user.full_name}`);
      } else {
        userIds.push(check[0].id);
        console.log(`ℹ️  User already exists: ${user.email}`);
      }
    }

    // Get all user IDs including admin
    const [allUsers] = await connection.query('SELECT id FROM users ORDER BY id LIMIT 3');
    const allUserIds = allUsers.map(u => u.id);

    // Add Skills (2 per user)
    console.log('\n📚 Adding skills...');
    const skills = [
      { user_id: allUserIds[0], skill_name: 'Python Programming', skill_type: 'offered', proficiency_level: 'advanced' },
      { user_id: allUserIds[0], skill_name: 'Web Development', skill_type: 'offered', proficiency_level: 'intermediate' },
      { user_id: allUserIds[1], skill_name: 'Graphic Design', skill_type: 'offered', proficiency_level: 'advanced' },
      { user_id: allUserIds[1], skill_name: 'Spanish Language', skill_type: 'needed', proficiency_level: 'beginner' },
    ];

    for (const skill of skills) {
      try {
        await connection.query(
          'INSERT INTO skills (user_id, skill_name, skill_type, proficiency_level) VALUES (?, ?, ?, ?)',
          [skill.user_id, skill.skill_name, skill.skill_type, skill.proficiency_level]
        );
        console.log(`  ✅ Added skill: ${skill.skill_name}`);
      } catch (err) {
        if (!err.message.includes('Duplicate')) {
          console.log(`  ⚠️  Skill might already exist: ${skill.skill_name}`);
        }
      }
    }

    // Add Services
    console.log('\n🛠️  Adding services...');
    const services = [
      {
        user_id: allUserIds[0],
        title: 'Python Tutoring for Beginners',
        description: 'Learn Python basics, data structures, and OOP concepts. Perfect for beginners!',
        category: 'Programming',
        credits_cost: 50,
        duration_minutes: 120
      },
      {
        user_id: allUserIds[1],
        title: 'Professional Logo Design',
        description: 'Get a custom logo designed for your brand or project. Includes 3 revisions.',
        category: 'Design',
        credits_cost: 75,
        duration_minutes: 180
      },
      {
        user_id: allUserIds[0],
        title: 'Web Development Consultation',
        description: 'One-on-one consultation for your web development project. HTML, CSS, JavaScript.',
        category: 'Programming',
        credits_cost: 60,
        duration_minutes: 60
      },
      {
        user_id: allUserIds[1],
        title: 'Graphic Design Basics Workshop',
        description: 'Learn Adobe Photoshop and Illustrator fundamentals in this hands-on workshop.',
        category: 'Design',
        credits_cost: 80,
        duration_minutes: 120
      }
    ];

    let serviceIds = [];
    for (const service of services) {
      try {
        const [result] = await connection.query(
          'INSERT INTO services (user_id, title, description, category, credits_cost, duration_minutes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [service.user_id, service.title, service.description, service.category, service.credits_cost, service.duration_minutes, 'active']
        );
        serviceIds.push(result.insertId);
        console.log(`  ✅ Added service: ${service.title}`);
      } catch (err) {
        console.log(`  ⚠️  Service might already exist: ${service.title}`);
      }
    }

    // Get existing service IDs if we didn't create new ones
    if (serviceIds.length === 0) {
      const [existingServices] = await connection.query('SELECT id FROM services LIMIT 4');
      serviceIds = existingServices.map(s => s.id);
    }

    // Add Transactions (2 sample transactions)
    let transactionIds = [];
    if (serviceIds.length >= 2 && allUserIds.length >= 3) {
      console.log('\n💰 Adding transactions...');
      const transactions = [
        {
          service_id: serviceIds[0],
          requester_id: allUserIds[2],
          provider_id: allUserIds[0],
          status: 'completed',
          credits_amount: 50
        },
        {
          service_id: serviceIds[1],
          requester_id: allUserIds[0],
          provider_id: allUserIds[1],
          status: 'completed',
          credits_amount: 75
        }
      ];

      for (const transaction of transactions) {
        try {
          const [result] = await connection.query(
            'INSERT INTO transactions (service_id, requester_id, provider_id, status, credits_amount) VALUES (?, ?, ?, ?, ?)',
            [transaction.service_id, transaction.requester_id, transaction.provider_id, transaction.status, transaction.credits_amount]
          );
          
          transactionIds.push(result.insertId);
          
          // If completed, update credits
          if (transaction.status === 'completed') {
            await connection.query('UPDATE users SET credits = credits - ? WHERE id = ?', [transaction.credits_amount, transaction.requester_id]);
            await connection.query('UPDATE users SET credits = credits + ? WHERE id = ?', [transaction.credits_amount, transaction.provider_id]);
          }
          
          console.log(`  ✅ Added transaction (${transaction.status})`);
        } catch (err) {
          console.log(`  ⚠️  Could not add transaction: ${err.message}`);
        }
      }
    }

    // Add Reviews (2 sample reviews) - MUST USE TRANSACTION IDs
    if (transactionIds.length >= 2 && allUserIds.length >= 3) {
      console.log('\n⭐ Adding reviews...');
      const reviews = [
        {
          transaction_id: transactionIds[0],
          reviewer_id: allUserIds[2],
          reviewee_id: allUserIds[0],
          rating: 5,
          comment: 'Excellent tutor! Very patient and explained everything clearly.'
        },
        {
          transaction_id: transactionIds[1],
          reviewer_id: allUserIds[0],
          reviewee_id: allUserIds[1],
          rating: 4,
          comment: 'Great design work, very creative. Delivered on time!'
        }
      ];

      for (const review of reviews) {
        try {
          await connection.query(
            'INSERT INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [review.transaction_id, review.reviewer_id, review.reviewee_id, review.rating, review.comment]
          );
          
          // Update reviewee's reputation
          const [avgResult] = await connection.query(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewee_id = ?',
            [review.reviewee_id]
          );
          
          await connection.query(
            'UPDATE users SET reputation_score = ?, total_reviews = ? WHERE id = ?',
            [avgResult[0].avg_rating, avgResult[0].total, review.reviewee_id]
          );
          
          console.log(`  ✅ Added review (${review.rating} stars)`);
        } catch (err) {
          console.log(`  ⚠️  Could not add review: ${err.message}`);
        }
      }
    }

    // Add Messages (2 sample messages)
    if (allUserIds.length >= 2) {
      console.log('\n💬 Adding messages...');
      const messages = [
        {
          sender_id: allUserIds[0],
          receiver_id: allUserIds[1],
          message: 'Hi! I\'m interested in your graphic design service. Are you available this week?'
        },
        {
          sender_id: allUserIds[1],
          receiver_id: allUserIds[0],
          message: 'Hello! Yes, I\'m available. When would be a good time for you?'
        }
      ];

      for (const message of messages) {
        try {
          await connection.query(
            'INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?)',
            [message.sender_id, message.receiver_id, message.message, false]
          );
          console.log(`  ✅ Added message`);
        } catch (err) {
          console.log(`  ⚠️  Could not add message`);
        }
      }
    }

    // Add Notifications (2 sample notifications)
    if (allUserIds.length >= 2) {
      console.log('\n🔔 Adding notifications...');
      const notifications = [
        {
          user_id: allUserIds[1],
          type: 'service_request',
          title: 'New Service Request',
          message: 'Someone requested your Python Tutoring service.',
          is_read: false
        },
        {
          user_id: allUserIds[0],
          type: 'review_received',
          title: 'New Review',
          message: 'You received a 5-star review!',
          is_read: false
        }
      ];

      for (const notification of notifications) {
        try {
          await connection.query(
            'INSERT INTO notifications (user_id, type, title, message, is_read) VALUES (?, ?, ?, ?, ?)',
            [notification.user_id, notification.type, notification.title, notification.message, notification.is_read]
          );
          console.log(`  ✅ Added notification: ${notification.title}`);
        } catch (err) {
          console.log(`  ⚠️  Could not add notification`);
        }
      }
    }

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   - Users: Added/Verified');
    console.log('   - Skills: 4 entries');
    console.log('   - Services: 4 entries');
    console.log('   - Transactions: 2 entries');
    console.log('   - Reviews: 2 entries');
    console.log('   - Messages: 2 entries');
    console.log('   - Notifications: 2 entries\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
