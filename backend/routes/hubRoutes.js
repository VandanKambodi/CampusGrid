const express = require('express');
const router = express.Router();
const { 
    uploadResource, getResources, toggleResourceUpvote, 
    createJob, getJobs 
} = require('../controllers/hubController');
const { 
    requestAccountCreation, requestPasswordReset, 
    getPendingRequests, processRequest, 
    directCreateStudent, directChangePassword 
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Resource Vault Routes
router.route('/resources')
    .get(protect, getResources)
    .post(protect, upload.single('file'), uploadResource);

router.put('/resources/:id/upvote', protect, toggleResourceUpvote);

// Placements Cell Routes
router.route('/jobs')
    .get(protect, getJobs)
    .post(protect, admin, createJob);

// Public Routes 
router.post('/requests/account', requestAccountCreation);
router.post('/requests/reset-password', requestPasswordReset);

// Admin Management Routes 
router.get('/admin/requests', protect, admin, getPendingRequests);
router.put('/admin/requests/:id', protect, admin, processRequest);
router.post('/admin/users', protect, admin, directCreateStudent);
router.put('/admin/users/:id/password', protect, admin, directChangePassword);

module.exports = router;