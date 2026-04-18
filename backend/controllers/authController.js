const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken } = require('../middleware/authMiddleware');
const { sendEmail } = require('../services/emailService');

// @desc    Send email verification code
// @route   POST /api/auth/send-verification
// @access  Public
exports.sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Exactly: k + 7 digits + @kingston.ac.uk
    const cleanEmail = email.trim().toLowerCase();
    if (!/^k\d{7}@kingston\.ac\.uk$/.test(cleanEmail)) {
      return res.status(400).json({
        message: 'Invalid email format. Use: k1234567@kingston.ac.uk'
      });
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        verified TINYINT(1) DEFAULT 0,
        UNIQUE KEY unique_email (email)
      )
    `);

    // Fixed demo code — no random generation
    const FIXED_CODE = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      `INSERT INTO verification_codes (email, code, expires_at, verified)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at), verified = 0`,
      [cleanEmail, FIXED_CODE, expiresAt]
    );

    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
  }
};

// @desc    Verify email code
// @route   POST /api/auth/verify-code
// @access  Public
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }
    const cleanEmail = email.trim().toUpperCase();

    const [rows] = await db.query(
      `SELECT id FROM verification_codes
       WHERE UPPER(email) = ? AND code = ? AND expires_at > NOW() AND verified = 0`,
      [cleanEmail, code.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code. Please try again.' });
    }

    await db.query('UPDATE verification_codes SET verified = 1 WHERE UPPER(email) = ?', [cleanEmail]);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, full_name, major, year_of_study } = req.body;

    // Validation
    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Normalize email - trim whitespace, keep uppercase domain
    const normalizedEmail = email.trim();

    // Enforce Kingston University email domain
    if (!normalizedEmail.toLowerCase().endsWith('@kingston.ac.uk')) {
      return res.status(400).json({ message: 'Only Kingston University emails (@KINGSTON.AC.UK) are allowed' });
    }

    // Backend password length enforcement
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check that the Kingston email was verified
    const [verified] = await db.query(
      'SELECT id FROM verification_codes WHERE email = ? AND verified = 1',
      [normalizedEmail]
    );
    if (verified.length === 0) {
      return res.status(400).json({ message: 'Email not verified. Please verify your Kingston email first.' });
    }

    // Check if user exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role (admin if email matches)
    const role = normalizedEmail.toLowerCase() === 'k2355109@kingston.ac.uk' ? 'admin' : 'student';

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (email, password, full_name, role, major, year_of_study) VALUES (?, ?, ?, ?, ?, ?)',
      [normalizedEmail, hashedPassword, full_name.trim(), role, major, year_of_study]
    );

    // Get created user
    const [users] = await db.query(
      'SELECT id, email, full_name, role, credits, reputation_score FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = users[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        credits: user.credits,
        reputation_score: parseFloat(user.reputation_score)
      },
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Normalize email before lookup
    const normalizedEmail = email.trim();

    // Get user (case-insensitive lookup)
    let [users] = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [normalizedEmail]
    );

    // ── Demo student accounts — presentation only ──────────────────────
    if (users.length === 0) {
      const emailKey = normalizedEmail.toLowerCase();
      const DEMO_STUDENTS = {
        'k1234567@kingston.ac.uk': { password: 'Password123', full_name: 'Demo Student One' },
        'k7654321@kingston.ac.uk': { password: 'Password123', full_name: 'Demo Student Two' },
      };
      const demo = DEMO_STUDENTS[emailKey];
      if (demo && password === demo.password) {
        const hashed = await bcrypt.hash(password, 10);
        await db.query(
          `INSERT IGNORE INTO users (email, password, full_name, role, credits, reputation_score)
           VALUES (?, ?, ?, 'student', 100, 0.00)`,
          [emailKey, hashed, demo.full_name]
        );
        [users] = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [emailKey]);
      }
    }
    // ──────────────────────────────────────────────────────────────────

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check account status
    if (user.account_status !== 'active') {
      return res.status(403).json({ message: 'Account is suspended or deleted' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        major: user.major,
        year_of_study: user.year_of_study,
        credits: user.credits,
        reputation_score: parseFloat(user.reputation_score),
        avatar_url: user.avatar_url
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, email, full_name, role, major, year_of_study, bio, avatar_url, 
              credits, reputation_score, total_reviews, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    // Also fetch skills so the client has everything in one call
    const [skills] = await db.query(
      'SELECT skill_name, skill_type, proficiency_level FROM skills WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      user: { ...users[0], skills }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'New password must differ from current password' });
    }

    // Get user with password
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
