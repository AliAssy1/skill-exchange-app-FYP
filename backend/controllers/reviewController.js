const db = require('../config/database');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { transaction_id, rating, comment } = req.body;

    if (!transaction_id || !rating) {
      await connection.rollback();
      return res.status(400).json({ message: 'Please provide transaction_id and rating' });
    }

    if (rating < 1 || rating > 5) {
      await connection.rollback();
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Get transaction
    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? AND status = "completed"',
      [transaction_id]
    );

    if (transactions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Transaction not found or not completed' });
    }

    const transaction = transactions[0];

    // Check if user is part of transaction
    if (transaction.requester_id !== req.user.id && transaction.provider_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Determine reviewee (the other person)
    const reviewee_id = transaction.requester_id === req.user.id 
      ? transaction.provider_id 
      : transaction.requester_id;

    // Check if review already exists
    const [existing] = await connection.query(
      'SELECT id FROM reviews WHERE transaction_id = ? AND reviewer_id = ?',
      [transaction_id, req.user.id]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'You have already reviewed this transaction' });
    }

    // Create review
    await connection.query(
      'INSERT INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [transaction_id, req.user.id, reviewee_id, rating, comment]
    );

    // Update reviewee's reputation score and total reviews
    await connection.query(
      `UPDATE users 
       SET reputation_score = (
         SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?
       ),
       total_reviews = total_reviews + 1
       WHERE id = ?`,
      [reviewee_id, reviewee_id]
    );

    // Create notification
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES (?, 'new_review', 'New Review Received', ?)`,
      [reviewee_id, `You received a ${rating}-star review!`]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// @desc    Get user reviews
// @route   GET /api/reviews/user/:userId
// @access  Public
exports.getUserReviews = async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );

    res.json({
      success: true,
      reviews
    });

  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get transaction reviews
// @route   GET /api/reviews/transaction/:transactionId
// @access  Private
exports.getTransactionReviews = async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.*, u.full_name as reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.transaction_id = ?`,
      [req.params.transactionId]
    );

    res.json({
      success: true,
      reviews
    });

  } catch (error) {
    console.error('Get transaction reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
