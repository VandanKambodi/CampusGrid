const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'admin', 'moderator', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

membershipSchema.index({ community: 1, user: 1 }, { unique: true });
membershipSchema.index({ community: 1, role: 1 });
membershipSchema.index({ user: 1 });

module.exports = mongoose.model('CommunityMembership', membershipSchema);