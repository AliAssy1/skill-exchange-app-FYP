const db = require('../config/database');

// @desc    Create transaction (request service)
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { service_id, scheduled_date, notes } = req.body;

    // Get service details
    const [services] = await connection.query('SELECT * FROM services WHERE id = ? AND status = "active"', [service_id]);

    if (services.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Service not found or inactive' });
    }

    const service = services[0];

    // Check if requesting own service
    if (service.user_id === req.user.id) {
      await connection.rollback();
      return res.status(400).json({ message: 'Cannot request your own service' });
    }

    // Check if user has enough credits
    const [users] = await connection.query('SELECT credits FROM users WHERE id = ?', [req.user.id]);
    
    if (users[0].credits < service.credits_cost) {
      await connection.rollback();
      return res.status(400).json({ message: 'Insufficient credits' });
    }

    // Create transaction
    const [result] = await connection.query(
      `INSERT INTO transactions (service_id, requester_id, provider_id, credits_amount, scheduled_date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [service_id, req.user.id, service.user_id, service.credits_cost, scheduled_date, notes]
    );

    // Create notification for provider
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'transaction_request', 'New Service Request', ?, ?)`,
      [service.user_id, `${req.user.full_name} requested your service: ${service.title}`, `/transactions/${result.insertId}`]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Service requested successfully',
      transaction_id: result.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    let query = `
      SELECT t.*, 
             s.title as service_title,
             s.category,
             u_req.full_name as requester_name, u_req.avatar_url as requester_avatar,
             u_prov.full_name as provider_name, u_prov.avatar_url as provider_avatar
      FROM transactions t
      JOIN services s ON t.service_id = s.id
      JOIN users u_req ON t.requester_id = u_req.id
      JOIN users u_prov ON t.provider_id = u_prov.id
      WHERE (t.requester_id = ? OR t.provider_id = ?)
    `;

    const params = [req.user.id, req.user.id];

    if (type === 'requested') {
      query += ' AND t.requester_id = ?';
      params.push(req.user.id);
    } else if (type === 'provided') {
      query += ' AND t.provider_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY t.created_at DESC';

    const [transactions] = await db.query(query, params);

    res.json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update transaction status
// @route   PUT /api/transactions/:id/status
// @access  Private
exports.updateTransactionStatus = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { status } = req.body;
    const validStatuses = ['accepted', 'in_progress', 'completed', 'cancelled', 'disputed'];

    if (!validStatuses.includes(status)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get transaction
    const [transactions] = await connection.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);

    if (transactions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = transactions[0];

    // Check if user is involved in transaction
    if (transaction.requester_id !== req.user.id && transaction.provider_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update transaction
    await connection.query(
      'UPDATE transactions SET status = ?, completion_date = ? WHERE id = ?',
      [status, status === 'completed' ? new Date() : null, req.params.id]
    );

    // Handle completed transaction - transfer credits
    if (status === 'completed' && transaction.status !== 'completed') {
      // Re-check requester has enough credits before completing
      const [requesterData] = await connection.query(
        'SELECT credits FROM users WHERE id = ?',
        [transaction.requester_id]
      );

      if (requesterData[0].credits < transaction.credits_amount) {
        await connection.rollback();
        return res.status(400).json({ message: 'Requester has insufficient credits to complete this transaction' });
      }

      // Deduct credits from requester
      await connection.query(
        'UPDATE users SET credits = credits - ? WHERE id = ?',
        [transaction.credits_amount, transaction.requester_id]
      );

      // Add credits to provider
      await connection.query(
        'UPDATE users SET credits = credits + ? WHERE id = ?',
        [transaction.credits_amount, transaction.provider_id]
      );

      // Create notifications
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'transaction_completed', 'Service Completed', ?),
                (?, 'transaction_completed', 'Service Completed', ?)`,
        [
          transaction.requester_id, 'Your service request has been completed. Please leave a review!',
          transaction.provider_id, 'You have completed a service. Credits have been added to your account!'
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Transaction status updated successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Update transaction status error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const [transactions] = await db.query(
      `SELECT t.*, 
              s.title as service_title, s.description as service_description,
              u_req.full_name as requester_name, u_req.email as requester_email,
              u_prov.full_name as provider_name, u_prov.email as provider_email
       FROM transactions t
       JOIN services s ON t.service_id = s.id
       JOIN users u_req ON t.requester_id = u_req.id
       JOIN users u_prov ON t.provider_id = u_prov.id
       WHERE t.id = ? AND (t.requester_id = ? OR t.provider_id = ?)`,
      [req.params.id, req.user.id, req.user.id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      success: true,
      transaction: transactions[0]
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
