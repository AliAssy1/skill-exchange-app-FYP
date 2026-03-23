const db = require('../config/database');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, email, full_name, role, major, year_of_study, bio, avatar_url, 
              credits, reputation_score, total_reviews, created_at 
       FROM users WHERE id = ? AND account_status = 'active'`,
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user skills
    const [skills] = await db.query(
      'SELECT skill_name, skill_type, proficiency_level FROM skills WHERE user_id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      user: {
        ...users[0],
        skills: skills
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, major, year_of_study, bio } = req.body;

    // Sanitize inputs
    const trimmedName = full_name ? full_name.trim() : null;
    const trimmedBio = bio ? bio.trim() : null;

    if (!trimmedName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    await db.query(
      'UPDATE users SET full_name = ?, major = ?, year_of_study = ?, bio = ? WHERE id = ?',
      [trimmedName, major, year_of_study, trimmedBio, req.user.id]
    );

    const [users] = await db.query(
      'SELECT id, email, full_name, major, year_of_study, bio, avatar_url, credits FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: users[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add/Update user skills
// @route   POST /api/users/skills
// @access  Private
exports.updateSkills = async (req, res) => {
  try {
    const { skills } = req.body; // Array of { skill_name, skill_type, proficiency_level }

    // Delete existing skills
    await db.query('DELETE FROM skills WHERE user_id = ?', [req.user.id]);

    // Insert new skills
    if (skills && skills.length > 0) {
      const values = skills.map(skill => [
        req.user.id,
        skill.skill_name,
        skill.skill_type,
        skill.proficiency_level || 'intermediate'
      ]);

      await db.query(
        'INSERT INTO skills (user_id, skill_name, skill_type, proficiency_level) VALUES ?',
        [values]
      );
    }

    res.json({
      success: true,
      message: 'Skills updated successfully'
    });

  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user stats
// @route   GET /api/users/:id/stats
// @access  Public
exports.getUserStats = async (req, res) => {
  try {
    // Get services offered count
    const [servicesOffered] = await db.query(
      'SELECT COUNT(*) as count FROM services WHERE user_id = ?',
      [req.params.id]
    );

    // Get transactions as requester count
    const [requested] = await db.query(
      'SELECT COUNT(*) as count FROM transactions WHERE requester_id = ?',
      [req.params.id]
    );

    // Get completed exchanges
    const [completed] = await db.query(
      'SELECT COUNT(*) as count FROM transactions WHERE (requester_id = ? OR provider_id = ?) AND status = "completed"',
      [req.params.id, req.params.id]
    );

    res.json({
      success: true,
      stats: {
        services_offered: servicesOffered[0].count,
        services_requested: requested[0].count,
        completed_exchanges: completed[0].count
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search users
// @route   GET /api/users/search?q=query
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Please provide search query' });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // cap at 50
    const offset = (pageNum - 1) * limitNum;

    const [users] = await db.query(
      `SELECT id, full_name, email, major, avatar_url, reputation_score 
       FROM users 
       WHERE account_status = 'active' 
       AND (full_name LIKE ? OR email LIKE ? OR major LIKE ?)
       LIMIT ? OFFSET ?`,
      [`%${q}%`, `%${q}%`, `%${q}%`, limitNum, offset]
    );

    res.json({
      success: true,
      page: pageNum,
      limit: limitNum,
      users
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
