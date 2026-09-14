const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
    reason: {
        type: String,
        enum: ['spam', 'harassment', 'inappropriate content', 'fake account', 'other'],
        required: true
    },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending',
        index: true
    }
}, { timestamps: true });

reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);