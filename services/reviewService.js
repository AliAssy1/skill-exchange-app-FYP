import api from './api';

class ReviewService {
  // Create a review
  async createReview(reviewData) {
    try {
      const response = await api.post('/reviews', reviewData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get user reviews
  async getUserReviews(userId) {
    try {
      const response = await api.get(`/reviews/user/${userId}`);
      return { success: true, data: response.data.reviews || [] };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get transaction reviews
  async getTransactionReviews(transactionId) {
    try {
      const response = await api.get(`/reviews/transaction/${transactionId}`);
      return { success: true, data: response.data.reviews || [] };
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

export default new ReviewService();
