const express = require('express');
const router = express.Router();
const { setupInitialAdmin, loginUser, registerStudent } = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/setup-admin', setupInitialAdmin);
router.post('/login', loginUser);
router.post('/register', protect, admin, registerStudent);

module.exports = router;