const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword, sendVerificationCode, verifyCode } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-verification', sendVerificationCode);
router.post('/verify-code', verifyCode);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
