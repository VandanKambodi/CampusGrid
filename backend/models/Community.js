const mongoose = require('mongoose');

const COMMUNITY_CATEGORIES = ['Technology', 'Design', 'Robotics', 'Photography', 'Sports', 'Music', 'Entrepreneurship', 'Cultural', 'Academic', 'Other'];

const communitySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    category: { type: String, enum: COMMUNITY_CATEGORIES, required: true },
    icon: { type: String, default: '🏫', trim: true, maxlength: 8 },
    coverImage: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

communitySchema.index({ status: 1, category: 1, name: 1 });
communitySchema.statics.categories = COMMUNITY_CATEGORIES;

module.exports = mongoose.model('Community', communitySchema);