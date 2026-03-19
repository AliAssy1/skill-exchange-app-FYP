const express = require('express');
const router = express.Router();
const { 
  createTransaction, 
  getTransactions, 
  getTransaction, 
  updateTransactionStatus 
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTransaction);
router.get('/', protect, getTransactions);
router.get('/:id', protect, getTransaction);
router.put('/:id/status', protect, updateTransactionStatus);

module.exports = router;
