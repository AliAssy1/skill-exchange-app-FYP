const express = require('express');
const router = express.Router();
const { 
  getServices, 
  getService, 
  createService, 
  updateService, 
  deleteService, 
  getUserServices 
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getServices);
router.get('/:id', getService);
router.get('/user/:userId', getUserServices);
router.post('/', protect, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
