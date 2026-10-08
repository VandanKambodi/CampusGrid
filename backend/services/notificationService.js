const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');

const defaultPreferences = {
  student: {
    social: { follow: true, like: true, comment: true, mention: true },
    messages: { newMessage: true },
    career: { placementDrive: true, placementUpdate: true },
    campus: { announcements: true, events: true, community: true },
    resources: { activity: true },
    system: { account: true }
  },
  admin: {
    studentManagement: { newAccountRequest: true },
    placements: { newPlacementApplication: true },
    moderation: { newReport: true },
    communities: { communityRequest: true },
    events: { eventActivity: true },
    system: { alerts: true }
  }
};

const deepMerge = (base, incoming) => {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return base;
  const clone = JSON.parse(JSON.stringify(base));
  Object.keys(incoming).forEach((key) => {
    if (incoming[key] && typeof incoming[key] === 'object' && !Array.isArray(incoming[key]) && clone[key] && typeof clone[key] === 'object' && !Array.isArray(clone[key])) {
      clone[key] = deepMerge(clone[key], incoming[key]);
    } else {
      clone[key] = incoming[key];
    }
  });
  return clone;
};

const getDefaultPreferences = (role = 'student') => {
  const targetRole = role === 'admin' ? 'admin' : 'student';
  return JSON.parse(JSON.stringify(defaultPreferences[targetRole]));
};

const resolvePreferencePath = (type) => {
  const map = {
    POST_LIKE: ['student', 'social', 'like'],
    POST_COMMENT: ['student', 'social', 'comment'],
    COMMENT_REPLY: ['student', 'social', 'comment'],
    FOLLOW: ['student', 'social', 'follow'],
    MENTION: ['student', 'social', 'mention'],
    NEW_MESSAGE: ['student', 'messages', 'newMessage'],
    PLACEMENT_DRIVE: ['student', 'career', 'placementDrive'],
    ACCOUNT_APPROVED: ['student', 'system', 'account'],
    RESOURCE_UPVOTE: ['student', 'resources', 'activity'],
    EVENT_PUBLISHED: ['student', 'campus', 'events'],
    EVENT_REMINDER: ['student', 'campus', 'events'],
    ANNOUNCEMENT: ['student', 'campus', 'announcements'],
    COMMUNITY_UPDATE: ['student', 'campus', 'community'],
    POLL_PUBLISHED: ['student', 'campus', 'community'],
    SURVEY_PUBLISHED: ['student', 'campus', 'community'],
    NEW_ACCOUNT_REQUEST: ['admin', 'studentManagement', 'newAccountRequest'],
    NEW_PLACEMENT_APPLICATION: ['admin', 'placements', 'newPlacementApplication'],
    RESOURCE_REPORT: ['admin', 'moderation', 'newReport'],
    POST_REPORT: ['admin', 'moderation', 'newReport'],
    COMMUNITY_REQUEST: ['admin', 'communities', 'communityRequest'],
    EVENT_REGISTRATION: ['admin', 'events', 'eventActivity'],
    SURVEY_PARTICIPATION_UPDATE: ['admin', 'events', 'eventActivity'],
    SYSTEM_ALERT: ['admin', 'system', 'alerts']
  };

  return map[type] || null;
};

const getUserPreferences = (user) => {
  const roleKey = user?.role === 'admin' ? 'admin' : 'student';
  const defaults = getDefaultPreferences(roleKey);
  const prefs = user?.notificationPreferences || {};
  return deepMerge(defaults, prefs?.[roleKey] || prefs || {});
};

const isNotificationEnabled = (user, type) => {
  if (!user || !type) return true;
  const prefPath = resolvePreferencePath(type);
  if (!prefPath) return true;
  const prefs = getUserPreferences(user);
  const [scope, category, key] = prefPath;
  if (scope === 'student') {
    return Boolean(prefs?.[category]?.[key]);
  }
  return Boolean(prefs?.[category]?.[key]);
};

const normalizeRecipientId = (recipient) => {
  if (!recipient) return null;
  if (typeof recipient === 'string') return recipient;
  return recipient._id ? recipient._id.toString() : recipient.toString();
};

const normalizeActorId = (actor) => {
  if (!actor) return null;
  if (typeof actor === 'string') return actor;
  return actor._id ? actor._id.toString() : actor.toString();
};

const createNotification = async ({
  recipient,
  actor,
  type,
  title,
  message,
  link = '',
  entityType = '',
  entityId = null,
  metadata = {},
  skipPreferenceCheck = false,
  dedupe = true
}) => {
  if (!recipient || !type || !title || !message) return null;

  const recipientId = normalizeRecipientId(recipient);
  if (!mongoose.Types.ObjectId.isValid(recipientId)) return null;

  if (!skipPreferenceCheck) {
    const recipientUser = await User.findById(recipientId).select('role notificationPreferences');
    if (!recipientUser) return null;
    if (!isNotificationEnabled(recipientUser, type)) return null;
  }

  if (dedupe) {
    const duplicateCandidates = ['POST_LIKE', 'FOLLOW', 'RESOURCE_UPVOTE', 'ACCOUNT_APPROVED'];
    if (duplicateCandidates.includes(type)) {
      const existing = await Notification.findOne({
        recipient: recipientId,
        actor: normalizeActorId(actor),
        type,
        entityType,
        entityId
      }).sort({ createdAt: -1 });
      if (existing) return existing;
    }
  }

  const doc = await Notification.create({
    recipient: recipientId,
    actor: normalizeActorId(actor),
    type,
    title,
    message,
    link,
    entityType,
    entityId,
    metadata
  });

  return Notification.findById(doc._id).populate('actor', 'name profilePicture role');
};

const createBulkNotifications = async ({ recipients, actor, type, title, message, link = '', entityType = '', entityId = null, metadata = {} }) => {
  if (!Array.isArray(recipients) || recipients.length === 0) return [];
  const uniqueRecipients = [...new Set(recipients.map((item) => normalizeRecipientId(item)).filter(Boolean))];
  const validRecipients = [];
  for (const recipientId of uniqueRecipients) {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) continue;
    const target = await User.findById(recipientId).select('role notificationPreferences');
    if (!target) continue;
    if (!isNotificationEnabled(target, type)) continue;
    validRecipients.push(recipientId);
  }
  if (!validRecipients.length) return [];

  const notifications = validRecipients.map((recipientId) => ({
    recipient: recipientId,
    actor: normalizeActorId(actor),
    type,
    title,
    message,
    link,
    entityType,
    entityId,
    metadata
  }));

  const docs = await Notification.insertMany(notifications);
  return Notification.find({ _id: { $in: docs.map(doc => doc._id) } }).populate('actor', 'name profilePicture role');
};

const getUserNotifications = async ({ userId, page = 1, limit = 20, onlyUnread = false }) => {
  const query = { recipient: userId };
  if (onlyUnread) query.isRead = false;
  const [notifications, total] = await Promise.all([
    Notification.find(query).populate('actor', 'name profilePicture role').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(query)
  ]);

  return {
    notifications,
    page,
    limit,
    total,
    hasMore: page * limit < total
  };
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ recipient: userId, isRead: false });
  return count;
};

const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
  if (!notification) return null;
  if (notification.isRead) return notification;
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();
  return notification;
};

const markAllNotificationsAsRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, {
    $set: { isRead: true, readAt: new Date() }
  });
  return true;
};

const deleteNotification = async (notificationId, userId) => {
  const result = await Notification.deleteOne({ _id: notificationId, recipient: userId });
  return result.deletedCount > 0;
};

const serializeNotificationPreferences = (user) => {
  if (!user) return getDefaultPreferences('student');
  const role = user.role === 'admin' ? 'admin' : 'student';
  const base = getDefaultPreferences(role);
  return deepMerge(base, user.notificationPreferences || {});
};

const updateNotificationPreferences = async ({ user, preferences }) => {
  if (!user) return getDefaultPreferences('student');
  const role = user.role === 'admin' ? 'admin' : 'student';
  const current = serializeNotificationPreferences(user);
  const merged = deepMerge(current, preferences || {});
  user.notificationPreferences = { ...user.notificationPreferences, [role]: merged };
  await user.save();
  return user.notificationPreferences;
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  isNotificationEnabled,
  getDefaultPreferences,
  serializeNotificationPreferences,
  updateNotificationPreferences
};
