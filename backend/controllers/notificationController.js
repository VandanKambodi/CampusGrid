const Notification = require('../models/Notification');
const { getUserNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, serializeNotificationPreferences, updateNotificationPreferences } = require('../services/notificationService');

const getNotifications = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const unreadOnly = req.query.unread === 'true';

    const data = await getUserNotifications({
      userId: req.user._id,
      page,
      limit,
      onlyUnread: unreadOnly
    });

    res.json(data);
  } catch (error) {
    console.error('Get notifications failed', error);
    res.status(500).json({ message: 'Unable to load notifications.' });
  }
};

const getUnreadCountController = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    console.error('Unread count failed', error);
    res.status(500).json({ message: 'Unable to load unread count.' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await markNotificationAsRead(req.params.id, req.user._id);
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json(notification);
  } catch (error) {
    console.error('Mark read failed', error);
    res.status(500).json({ message: 'Unable to update notification.' });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await markAllNotificationsAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all read failed', error);
    res.status(500).json({ message: 'Unable to update notifications.' });
  }
};

const deleteUserNotification = async (req, res) => {
  try {
    const deleted = await deleteNotification(req.params.id, req.user._id);
    if (!deleted) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    console.error('Delete notification failed', error);
    res.status(500).json({ message: 'Unable to delete notification.' });
  }
};

const getNotificationPreferences = async (req, res) => {
  try {
    const preferences = serializeNotificationPreferences(req.user);
    res.json({ preferences });
  } catch (error) {
    console.error('Get preferences failed', error);
    res.status(500).json({ message: 'Unable to load notification preferences.' });
  }
};

const updateNotificationPreferencesController = async (req, res) => {
  try {
    const preferences = await updateNotificationPreferences({ user: req.user, preferences: req.body.preferences || req.body });
    res.json({ message: 'Notification preferences updated.', preferences });
  } catch (error) {
    console.error('Update preferences failed', error);
    res.status(500).json({ message: 'Unable to update notification preferences.' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCountController,
  markNotificationRead,
  markAllNotificationsRead,
  deleteUserNotification,
  getNotificationPreferences,
  updateNotificationPreferencesController
};
