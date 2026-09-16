const mongoose = require('mongoose');

const surveySubmissionSchema = new mongoose.Schema({
    survey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Survey',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    answers: [{
        questionIndex: {
            type: Number,
            required: true
        },
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
        answer: mongoose.Schema.Types.Mixed
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

surveySubmissionSchema.index({ survey: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('SurveySubmission', surveySubmissionSchema);
