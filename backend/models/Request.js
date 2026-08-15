const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['account_creation', 'password_reset'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rollNo: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        default: ''
    },
    course: {
        type: String,
        default: 'B.Tech'
    },
    branch: {
        type: String,
        default: 'CSE'
    },
    requestedPassword: {
        type: String,
        default: ''
    },
    reason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);