const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    targetBranch: {
        type: String,
        enum: ['all', 'CSE', 'ECE', 'Mechanical', 'Civil'],
        default: 'all'
    },
    feedbackUrl: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Expired', 'Archived'],
        default: 'Draft'
    },
    startAt: {
        type: Date,
        default: Date.now
    },
    endAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
