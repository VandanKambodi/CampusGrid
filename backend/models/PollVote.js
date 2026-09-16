const mongoose = require('mongoose');

const pollVoteSchema = new mongoose.Schema({
    poll: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poll',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    option: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

pollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('PollVote', pollVoteSchema);
