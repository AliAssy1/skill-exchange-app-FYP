const express = require('express');
const router = express.Router();
const { 
  createReview, 
  getUserReviews, 
  getTransactionReviews 
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.get('/transaction/:transactionId', protect, getTransactionReviews);

module.exports = router;
