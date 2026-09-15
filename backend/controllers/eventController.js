const Event = require('../models/Event');

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const validateEvent = (data) => {
    const { title, date, startTime, endTime, registrationRequired, registrationUrl } = data;
    if (!title?.trim() || !date || !startTime || !endTime) {
        return 'Title, date, start time, and end time are required.';
    }
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (!datePattern.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
        return 'Please provide a valid date.';
    }
    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
        return 'Please provide valid start and end times.';
    }
    if (endTime <= startTime) return 'End time must be after start time.';
    if (registrationRequired && !registrationUrl?.trim()) {
        return 'Registration URL is required when registration is enabled.';
    }
    if (registrationUrl?.trim()) {
        try {
            const url = new URL(registrationUrl);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        } catch {
            return 'Registration URL must be a valid HTTP or HTTPS URL.';
        }
    }
    return null;
};

const eventPayload = (body) => ({
    title: body.title?.trim(),
    description: body.description?.trim() || '',
    eventType: body.eventType,
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    location: body.location?.trim() || '',
    organizer: body.organizer?.trim() || '',
    registrationUrl: body.registrationUrl?.trim() || '',
    registrationRequired: body.registrationRequired === true || body.registrationRequired === 'true',
    maxParticipants: body.maxParticipants || undefined,
    contactEmail: body.contactEmail?.trim() || '',
    contactPhone: body.contactPhone?.trim() || '',
    status: body.status || 'Draft'
});

const getEvents = async (req, res) => {
    try {
        const { month, year } = req.query;
        const query = req.user.role === 'admin' ? {} : { status: { $in: ['Published', 'Cancelled'] } };

        if (month || year) {
            const numericMonth = Number(month);
            const numericYear = Number(year);
            if (!Number.isInteger(numericMonth) || numericMonth < 1 || numericMonth > 12 || !Number.isInteger(numericYear) || numericYear < 1970) {
                return res.status(400).json({ message: 'Invalid month or year.' });
            }
            query.date = { $regex: `^${numericYear}-${String(numericMonth).padStart(2, '0')}-` };
        }

        const events = await Event.find(query).populate('createdBy', 'name role').sort({ date: 1, startTime: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Unable to load campus events.' });
    }
};

const getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name role');
        if (!event || (event.status === 'Draft' && req.user.role !== 'admin')) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Unable to load event details.' });
    }
};

const createEvent = async (req, res) => {
    try {
        const payload = eventPayload(req.body);
        const validationError = validateEvent(payload);
        if (validationError) return res.status(400).json({ message: validationError });
        if (!Event.eventTypes.includes(payload.eventType)) return res.status(400).json({ message: 'Invalid event type.' });
        if (!['Draft', 'Published', 'Cancelled'].includes(payload.status)) return res.status(400).json({ message: 'Invalid event status.' });

        const event = await Event.create({ ...payload, createdBy: req.user._id, image: req.file?.path || '' });
        res.status(201).json(await event.populate('createdBy', 'name role'));
    } catch (error) {
        res.status(400).json({ message: error.message || 'Failed to create event.' });
    }
};

const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        const payload = eventPayload(req.body);
        const validationError = validateEvent(payload);
        if (validationError) return res.status(400).json({ message: validationError });
        if (!Event.eventTypes.includes(payload.eventType)) return res.status(400).json({ message: 'Invalid event type.' });
        if (!['Draft', 'Published', 'Cancelled'].includes(payload.status)) return res.status(400).json({ message: 'Invalid event status.' });

        Object.assign(event, payload);
        if (req.file) event.image = req.file.path;
        await event.save();
        res.json(await event.populate('createdBy', 'name role'));
    } catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update event.' });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found.' });
        res.json({ message: 'Event deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete event.' });
    }
};

const updateEventStatus = async (req, res) => {
    try {
        if (!['Draft', 'Published', 'Cancelled'].includes(req.body.status)) {
            return res.status(400).json({ message: 'Invalid event status.' });
        }
        const event = await Event.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }).populate('createdBy', 'name role');
        if (!event) return res.status(404).json({ message: 'Event not found.' });
        res.json(event);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Failed to update event status.' });
    }
};

module.exports = { getEvents, getEvent, createEvent, updateEvent, deleteEvent, updateEventStatus };
