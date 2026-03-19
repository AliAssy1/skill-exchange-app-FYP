import api from './api';

class ServiceService {
  // Get all services
  async getAllServices(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/services?${params.toString()}`);
      // Backend returns { success: true, services: [...], pagination: {...} }
      return { success: true, data: response.data.services || [] };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get service by ID
  async getServiceById(serviceId) {
    try {
      const response = await api.get(`/services/${serviceId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Create new service
  async createService(serviceData) {
    try {
      const response = await api.post('/services', serviceData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Update service
  async updateService(serviceId, serviceData) {
    try {
      const response = await api.put(`/services/${serviceId}`, serviceData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Delete service
  async deleteService(serviceId) {
    try {
      const response = await api.delete(`/services/${serviceId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get user's services
  async getUserServices(userId) {
    try {
      const response = await api.get(`/services/user/${userId}`);
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

export default new ServiceService();
