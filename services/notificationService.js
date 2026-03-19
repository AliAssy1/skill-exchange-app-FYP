import api from './api';

class NotificationService {
  async getNotifications() {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to fetch notifications' };
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to mark as read' };
    }
  }

  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to mark all as read' };
    }
  }
}

export default new NotificationService();
