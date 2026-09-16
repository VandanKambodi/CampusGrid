const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    voteCount: {
        type: Number,
        default: 0
    }
}, { _id: false });

const pollSchema = new mongoose.Schema({
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
    options: {
        type: [pollOptionSchema],
        validate: {
            validator: function (value) {
                return Array.isArray(value) && value.length >= 2;
            },
            message: 'At least two options are required for a poll.'
        }
    },
    targetBranch: {
        type: String,
        enum: ['all', 'CSE', 'ECE', 'Mechanical', 'Civil'],
        default: 'all'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Closed', 'Archived'],
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

module.exports = mongoose.model('Poll', pollSchema);
