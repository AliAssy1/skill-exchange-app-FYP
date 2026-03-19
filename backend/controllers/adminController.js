const db = require('../config/database');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Total users
    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users WHERE account_status = "active"');
    
    // Total services
    const [totalServices] = await db.query('SELECT COUNT(*) as count FROM services WHERE status = "active"');
    
    // Total transactions
    const [totalTransactions] = await db.query('SELECT COUNT(*) as count FROM transactions');
    
    // Completed transactions
    const [completedTransactions] = await db.query('SELECT COUNT(*) as count FROM transactions WHERE status = "completed"');
    
    // Pending reports
    const [pendingReports] = await db.query('SELECT COUNT(*) as count FROM reports WHERE status = "pending"');
    
    // Total credits in circulation
    const [creditsCirculating] = await db.query('SELECT SUM(credits) as total FROM users WHERE account_status = "active"');

    res.json({
      success: true,
      stats: {
        total_users: totalUsers[0].count,
        total_services: totalServices[0].count,
        total_transactions: totalTransactions[0].count,
        completed_transactions: completedTransactions[0].count,
        pending_reports: pendingReports[0].count,
        credits_circulating: creditsCirculating[0].total || 0
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, full_name, role, major, credits, reputation_score, total_reviews, account_status, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND account_status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.query(query, params);

    // Get total count
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM users');

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'suspended', 'deleted'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.query('UPDATE users SET account_status = ? WHERE id = ?', [status, req.params.id]);

    // Create notification
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES (?, 'account_status', 'Account Status Update', ?)`,
      [req.params.id, `Your account status has been changed to: ${status}`]
    );

    res.json({
      success: true,
      message: 'User status updated successfully'
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all services (admin)
// @route   GET /api/admin/services
// @access  Private/Admin
exports.getAllServices = async (req, res) => {
  try {
    const [services] = await db.query(
      `SELECT s.*, u.full_name, u.email
       FROM services s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );

    res.json({
      success: true,
      services
    });

  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete service
// @route   DELETE /api/admin/services/:id
// @access  Private/Admin
exports.deleteService = async (req, res) => {
  try {
    await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getAllReports = async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT r.*, 
              u_reporter.full_name as reporter_name,
              u_reported.full_name as reported_user_name,
              s.title as reported_service_title
       FROM reports r
       JOIN users u_reporter ON r.reporter_id = u_reporter.id
       LEFT JOIN users u_reported ON r.reported_user_id = u_reported.id
       LEFT JOIN services s ON r.reported_service_id = s.id
       ORDER BY r.created_at DESC`
    );

    res.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
exports.updateReport = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;

    await db.query(
      'UPDATE reports SET status = ?, admin_notes = ? WHERE id = ?',
      [status, admin_notes, req.params.id]
    );

    res.json({
      success: true,
      message: 'Report updated successfully'
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
