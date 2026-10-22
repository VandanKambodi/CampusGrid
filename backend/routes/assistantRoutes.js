const express = require('express');
const router = express.Router();
const { askPlatformAssistant } = require('../controllers/assistantController');
const { protect } = require('../middlewares/authMiddleware');

// Platform Assistant Chat Endpoint
router.post('/chat', protect, askPlatformAssistant);

module.exports = router;
