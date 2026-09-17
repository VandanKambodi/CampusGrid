const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    charOffset: { type: Number, default: 0 },
    pageNumber: { type: Number, default: 1 }
});

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    semester: { type: String, required: function() { return !this.community; } },
    branch: { type: String, required: function() { return !this.community; } },
    fileUrl: { type: String, required: true }, // The secure Cloudinary PDF link
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null, index: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Students can upvote good notes
    
    // AI Chunking & Indexing Fields
    chunks: [chunkSchema],
    totalPages: { type: Number, default: 1 },
    totalChunks: { type: Number, default: 0 },
    isIndexed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);