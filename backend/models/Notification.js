const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  type: {
    type: String,
    required: true,
    trim: true,
    index: true,
    enum: [
      'POST_LIKE',
      'POST_COMMENT',
      'COMMENT_REPLY',
      'FOLLOW',
      'NEW_MESSAGE',
      'PLACEMENT_DRIVE',
      'ACCOUNT_APPROVED',
      'RESOURCE_UPVOTE',
      'EVENT_PUBLISHED',
      'EVENT_REMINDER',
      'ANNOUNCEMENT',
      'COMMUNITY_UPDATE',
      'POLL_PUBLISHED',
      'SURVEY_PUBLISHED',
      'MENTION',
      'NEW_ACCOUNT_REQUEST',
      'NEW_PLACEMENT_APPLICATION',
      'RESOURCE_REPORT',
      'POST_REPORT',
      'COMMUNITY_REQUEST',
      'EVENT_REGISTRATION',
      'SURVEY_PARTICIPATION_UPDATE',
      'SYSTEM_ALERT'
    ]
  },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  link: { type: String, default: '' },
  entityType: { type: String, default: '' },
  entityId: { type: mongoose.Schema.Types.Mixed, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
