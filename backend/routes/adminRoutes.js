const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllServices,
  deleteService,
  getAllReports,
  updateReport,
  sendEmailToUser,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require admin access
router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/services', getAllServices);
router.delete('/services/:id', deleteService);
router.get('/reports', getAllReports);
router.put('/reports/:id', updateReport);
router.post('/send-email', sendEmailToUser);

module.exports = router;
