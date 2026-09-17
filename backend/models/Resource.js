const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    semester: { type: String, required: function() { return !this.community; } },
    branch: { type: String, required: function() { return !this.community; } },
    fileUrl: { type: String, required: true }, // The secure Cloudinary PDF link
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null, index: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Students can upvote good notes
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);