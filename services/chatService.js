import api from './api';

class ChatService {
  // Get conversations list
  async getConversations() {
    try {
      const response = await api.get('/chat/conversations');
      return { success: true, data: response.data.conversations || [] };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get messages with specific user
  async getMessages(userId) {
    try {
      const response = await api.get(`/chat/messages/${userId}`);
      return { success: true, data: response.data.messages || [] };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Send message
  async sendMessage(messageData) {
    try {
      const response = await api.post('/chat/messages', messageData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Mark messages as read
  async markAsRead(userId) {
    try {
      const response = await api.put(`/chat/mark-read/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await api.get('/chat/unread-count');
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Error handler
  handleError(error) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return { success: false, message };
  }
}

export default new ChatService();
