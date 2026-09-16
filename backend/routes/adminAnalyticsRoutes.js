const express = require('express');
const router = express.Router();
const { getAdminAnalytics } = require('../controllers/adminAnalyticsController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/analytics', protect, admin, getAdminAnalytics);

module.exports = router;