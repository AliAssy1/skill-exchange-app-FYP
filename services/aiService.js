import api from './api';

class AIService {
  // Search services using AI
  async searchServices(message) {
    try {
      const response = await api.post('/ai/search', { message });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Chat with AI assistant
  async chat(message) {
    try {
      const response = await api.post('/ai/chat', { message });
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

export default new AIService();
