const db = require('../config/database');

const activeUsers = new Map(); // Store online users

exports.initializeSocketIO = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins with their ID
    socket.on('user_online', (userId) => {
      activeUsers.set(userId.toString(), socket.id);
      console.log(`User ${userId} is now online`);
      
      // Broadcast online status
      io.emit('user_status_change', { userId, status: 'online' });
    });

    // Send message event
    socket.on('send_message', async (data) => {
      try {
        const { sender_id, receiver_id, message } = data;

        // Save message to database
        const [result] = await db.query(
          'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
          [sender_id, receiver_id, message]
        );

        // Get the full message with sender info
        const [newMessage] = await db.query(
          `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar 
           FROM messages m 
           JOIN users u ON m.sender_id = u.id 
           WHERE m.id = ?`,
          [result.insertId]
        );

        const messageData = newMessage[0];

        // Send to receiver if online
        const receiverSocketId = activeUsers.get(receiver_id.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', messageData);
        }

        // Send confirmation to sender
        socket.emit('message_sent', messageData);

        // Create notification for receiver
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, link)
           VALUES (?, 'new_message', 'New Message', ?, ?)`,
          [receiver_id, `New message from ${messageData.sender_name}`, `/chat/${sender_id}`]
        );

      } catch (error) {
        console.error('Socket send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { sender_id, receiver_id } = data;
      const receiverSocketId = activeUsers.get(receiver_id.toString());
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { userId: sender_id });
      }
    });

    socket.on('stop_typing', (data) => {
      const { sender_id, receiver_id } = data;
      const receiverSocketId = activeUsers.get(receiver_id.toString());
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_stop_typing', { userId: sender_id });
      }
    });

    // Mark messages as read
    socket.on('mark_as_read', async (data) => {
      try {
        const { user_id, other_user_id } = data;
        
        await db.query(
          'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?',
          [other_user_id, user_id]
        );

        // Notify sender that messages were read
        const senderSocketId = activeUsers.get(other_user_id.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', { userId: user_id });
        }

      } catch (error) {
        console.error('Socket mark as read error:', error);
      }
    });

    // User disconnect
    socket.on('disconnect', () => {
      // Find and remove user from active users
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          
          // Broadcast offline status
          io.emit('user_status_change', { userId, status: 'offline' });
          break;
        }
      }
    });

    // Get online users
    socket.on('get_online_users', () => {
      const onlineUserIds = Array.from(activeUsers.keys());
      socket.emit('online_users', onlineUserIds);
    });
  });

  console.log('📡 Socket.IO initialized for real-time chat');
};

// Export active users for other modules
exports.getActiveUsers = () => activeUsers;
