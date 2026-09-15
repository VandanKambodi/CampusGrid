const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus
} = require('../controllers/eventController');

router.get('/', protect, getEvents);
router.get('/:id', protect, getEvent);
router.post('/', protect, admin, upload.single('image'), createEvent);
router.put('/:id', protect, admin, upload.single('image'), updateEvent);
router.delete('/:id', protect, admin, deleteEvent);
router.patch('/:id/status', protect, admin, updateEventStatus);

module.exports = router;
