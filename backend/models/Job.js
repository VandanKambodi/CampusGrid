const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String, required: true },
    applyLink: { type: String, required: true },
    roleType: { type: String, enum: ['Internship', 'Full-Time', 'Hackathon', 'internship', 'full-time', 'hackathon'], required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isVerified: { type: Boolean, default: false } // Admins can verify legitimate jobs
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);