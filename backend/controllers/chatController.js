const db = require('../config/database');

// @desc    Get conversations list
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const [conversations] = await db.query(
      `SELECT DISTINCT
         CASE 
           WHEN m.sender_id = ? THEN m.receiver_id
           ELSE m.sender_id
         END as other_user_id,
         u.full_name, u.avatar_url,
         (SELECT message FROM messages 
          WHERE (sender_id = ? AND receiver_id = other_user_id) 
             OR (sender_id = other_user_id AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1) as last_message,
         (SELECT created_at FROM messages 
          WHERE (sender_id = ? AND receiver_id = other_user_id) 
             OR (sender_id = other_user_id AND receiver_id = ?)
          ORDER BY created_at DESC LIMIT 1) as last_message_time,
         (SELECT COUNT(*) FROM messages 
          WHERE sender_id = other_user_id AND receiver_id = ? AND is_read = FALSE) as unread_count
       FROM messages m
       JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
       WHERE m.sender_id = ? OR m.receiver_id = ?
       ORDER BY last_message_time DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );

    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages with specific user
// @route   GET /api/chat/messages/:userId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);

    // Validate userId param
    if (!Number.isFinite(otherUserId) || otherUserId <= 0) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const [messages] = await db.query(
      `SELECT m.*, u.full_name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [req.user.id, otherUserId, otherUserId, req.user.id]
    );

    // Mark messages as read
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
      [otherUserId, req.user.id]
    );

    res.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send message
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
        const { receiver_id, message } = req.body;

    if (!receiver_id || !message) {
      return res.status(400).json({ message: 'Please provide receiver_id and message' });
    }

    // Trim and validate message content
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      return res.status(400).json({ message: 'Message cannot be empty or whitespace' });
    }
    if (cleanMessage.length > 2000) {
      return res.status(400).json({ message: 'Message must be 2000 characters or less' });
    }

    // Validate receiver_id is a valid number
    const parsedReceiverId = parseInt(receiver_id);
    if (!Number.isFinite(parsedReceiverId) || parsedReceiverId <= 0) {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }

    // Prevent sending messages to yourself
    if (parsedReceiverId === req.user.id) {
      return res.status(400).json({ message: 'Cannot send a message to yourself' });
    }

    // Check if receiver exists
    const [users] = await db.query('SELECT id FROM users WHERE id = ? AND account_status = "active"', [parsedReceiverId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Receiver not found or account inactive' });
    }

    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [req.user.id, parsedReceiverId, cleanMessage]
    );

    // Create notification for receiver
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES (?, 'new_message', 'New Message', ?, ?)`,
      [parsedReceiverId, `New message from ${req.user.full_name}`, `/chat/${req.user.id}`]
    );

    const [newMessage] = await db.query(
      'SELECT m.*, u.full_name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: newMessage[0]
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/messages/read/:userId
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
      [req.params.userId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      unread_count: result[0].count
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
