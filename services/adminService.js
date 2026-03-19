import api from './api';

/**
 * Admin Service
 * Handles admin-specific API calls
 */
class AdminService {
  /**
   * Get dashboard statistics
   * @returns {Promise} Dashboard stats
   */
  async getDashboardStats() {
    try {
      const response = await api.get('/admin/stats');
      return { success: true, data: response.data.stats };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get all reports
   * @returns {Promise} List of reports
   */
  async getAllReports() {
    try {
      const response = await api.get('/admin/reports');
      return { success: true, data: response.data.reports };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update report status
   * @param {number} reportId - Report ID
   * @param {string} status - New status
   * @param {string} adminNotes - Admin notes
   * @returns {Promise} Updated report
   */
  async updateReportStatus(reportId, status, adminNotes = '') {
    try {
      const response = await api.put(`/admin/reports/${reportId}`, {
        status,
        admin_notes: adminNotes
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handler
   * @param {Error} error - Error object
   * @returns {Object} Error response
   */
  handleError(error) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('Admin Service Error:', message);
    return { success: false, message };
  }
}

export default new AdminService();
