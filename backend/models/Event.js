const mongoose = require('mongoose');

const EVENT_TYPES = [
    'Hackathon',
    'Workshop',
    'Seminar',
    'Cultural Event',
    'Sports',
    'Tech Event',
    'Club Event',
    'Guest Lecture',
    'Placement Session',
    'Other'
];

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    eventType: { type: String, enum: EVENT_TYPES, required: true },
    // A date-only value avoids browser/local timezone shifting the calendar day.
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    location: { type: String, default: '', trim: true },
    organizer: { type: String, default: '', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null, index: true },
    image: { type: String, default: '' },
    registrationUrl: { type: String, default: '', trim: true },
    registrationRequired: { type: Boolean, default: false },
    maxParticipants: { type: Number, min: 1 },
    contactEmail: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    status: { type: String, enum: ['Draft', 'Published', 'Cancelled'], default: 'Draft' }
}, { timestamps: true });

eventSchema.index({ date: 1, status: 1 });

eventSchema.statics.eventTypes = EVENT_TYPES;

module.exports = mongoose.model('Event', eventSchema);
