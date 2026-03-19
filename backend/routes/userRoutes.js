const express = require('express');
const router = express.Router();
const { 
  getUserProfile, 
  updateProfile, 
  updateSkills, 
  getUserStats, 
  searchUsers 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchUsers);
router.get('/:id', getUserProfile);
router.get('/:id/stats', getUserStats);
router.put('/profile', protect, updateProfile);
router.post('/skills', protect, updateSkills);

module.exports = router;
