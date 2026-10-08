const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getNotifications,
  getUnreadCountController,
  markNotificationRead,
  markAllNotificationsRead,
  deleteUserNotification,
  getNotificationPreferences,
  updateNotificationPreferencesController
} = require('../controllers/notificationController');

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCountController);
router.get('/preferences', protect, getNotificationPreferences);
router.patch('/read-all', protect, markAllNotificationsRead);
router.patch('/:id/read', protect, markNotificationRead);
router.delete('/:id', protect, deleteUserNotification);
router.patch('/preferences', protect, updateNotificationPreferencesController);

module.exports = router;
