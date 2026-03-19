const express = require('express');
const router = express.Router();
const { aiSearch, aiChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// @route   POST /api/ai/search
// @desc    Search services using AI
// @access  Private
router.post('/search', aiSearch);

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant
// @access  Private
router.post('/chat', aiChat);

module.exports = router;
