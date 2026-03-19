const db = require('../config/database');

// @desc    Create/Submit a report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
  try {
    const { reported_user_id, reported_service_id, reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ message: 'Please provide reason and description' });
    }

    // At least one of reported_user_id or reported_service_id must be provided
    if (!reported_user_id && !reported_service_id) {
      return res.status(400).json({ message: 'Please specify a user or service to report' });
    }

    const [result] = await db.query(
      `INSERT INTO reports (reporter_id, reported_user_id, reported_service_id, reason, description, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, reported_user_id || null, reported_service_id || null, reason, description]
    );

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report_id: result.insertId
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's own reports
// @route   GET /api/reports/my-reports
// @access  Private
const getMyReports = async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT r.*, 
              u_reported.full_name as reported_user_name,
              s.title as reported_service_title
       FROM reports r
       LEFT JOIN users u_reported ON r.reported_user_id = u_reported.id
       LEFT JOIN services s ON r.reported_service_id = s.id
       WHERE r.reporter_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReport,
  getMyReports
};
