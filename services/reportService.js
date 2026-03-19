import api from './api';

/**
 * Report Service
 * Handles report/moderation-related API calls
 */
class ReportService {
  /**
   * Create/Submit a new report
   * @param {Object} reportData - Report data
   * @returns {Promise} Response
   */
  async createReport(reportData) {
    try {
      const response = await api.post('/reports', reportData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get user's own reports
   * @returns {Promise} List of reports
   */
  async getMyReports() {
    try {
      const response = await api.get('/reports/my-reports');
      return { success: true, data: response.data.reports };
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
    console.error('Report Service Error:', message);
    return { success: false, message };
  }
}

export default new ReportService();
