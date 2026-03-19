import api from './api';

class TransactionService {
  // Create transaction
  async createTransaction(transactionData) {
    try {
      const response = await api.post('/transactions', transactionData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get user transactions
  async getTransactions(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      
      const response = await api.get(`/transactions?${queryParams.toString()}`);
      return { success: true, data: response.data.transactions || [] };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get transaction by ID
  async getTransaction(transactionId) {
    try {
      const response = await api.get(`/transactions/${transactionId}`);
      return { success: true, data: response.data.transaction };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Update transaction status
  async updateTransactionStatus(transactionId, status) {
    try {
      const response = await api.put(`/transactions/${transactionId}/status`, { status });
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

export default new TransactionService();
