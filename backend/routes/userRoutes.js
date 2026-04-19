const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  updateSkills,
  getUserStats,
  searchUsers,
  updateLocation,
  getNearbyUsers,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchUsers);
router.get('/nearby', protect, getNearbyUsers);
router.get('/:id', getUserProfile);
router.get('/:id/stats', getUserStats);
router.put('/profile', protect, updateProfile);
router.put('/location', protect, updateLocation);
router.post('/skills', protect, updateSkills);

module.exports = router;
