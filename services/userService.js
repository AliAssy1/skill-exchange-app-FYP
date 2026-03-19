import api from './api';

class UserService {
  // Get all users (admin only)
  async getAllUsers() {
    try {
      const response = await api.get('/admin/users');
      // Backend returns { success: true, users: [...], pagination: {...} }
      return { success: true, data: response.data.users || [] };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get current user's profile
  async getProfile() {
    try {
      const response = await api.get('/users/profile');
      return { success: true, data: response.data };
    } catch (error) {
      // Fallback: try getting from auth context data
      return this.handleError(error);
    }
  }

  // Update user profile
  async updateProfile(userId, userData) {
    try {
      // Backend uses JWT token to identify user, doesn't need userId in path
      const response = await api.put('/users/profile', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Delete user (admin only)
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get user statistics
  async getUserStats(userId) {
    try {
      const response = await api.get(`/users/${userId}/stats`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Update user status (admin only)
  async updateUserStatus(userId, status) {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Update user skills
  async updateSkills(skills) {
    try {
      const response = await api.post('/users/skills', { skills });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Search users
  async searchUsers(query) {
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return { success: true, data: response.data.users };
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

export default new UserService();
