const mongoose = require('mongoose');

const surveyQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['singleChoice', 'multipleChoice', 'textAnswer'],
        required: true
    },
    options: {
        type: [String],
        default: []
    },
    required: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const surveySchema = new mongoose.Schema({
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
    questions: {
        type: [surveyQuestionSchema],
        validate: {
            validator: function (value) {
                return Array.isArray(value) && value.length > 0;
            },
            message: 'At least one question is required for a survey.'
        }
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

module.exports = mongoose.model('Survey', surveySchema);
