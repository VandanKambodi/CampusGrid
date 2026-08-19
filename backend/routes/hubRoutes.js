const express = require('express');
const router = express.Router();
const { 
    uploadResource, getResources, toggleResourceUpvote, deleteResource, downloadResource,
    createJob, getJobs, deleteJob
} = require('../controllers/hubController');
const { 
    requestAccountCreation, requestPasswordReset, 
    getPendingRequests, processRequest, 
    directCreateStudent, directChangePassword, deleteStudent
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Resource Vault Routes
router.route('/resources')
    .get(protect, getResources)
    .post(protect, upload.single('file'), uploadResource);

router.get('/resources/download/:id', downloadResource);
router.delete('/resources/:id', protect, deleteResource);
router.put('/resources/:id/upvote', protect, toggleResourceUpvote);

// Placements Cell Routes
router.route('/jobs')
    .get(protect, getJobs)
    .post(protect, admin, createJob);

router.delete('/jobs/:id', protect, admin, deleteJob);

// Public Routes 
router.post('/requests/account', requestAccountCreation);
router.post('/requests/reset-password', requestPasswordReset);

// Admin Management Routes 
router.get('/admin/requests', protect, admin, getPendingRequests);
router.put('/admin/requests/:id', protect, admin, processRequest);
router.post('/admin/users', protect, admin, directCreateStudent);
router.delete('/admin/users/:id', protect, admin, deleteStudent);
router.put('/admin/users/:id/password', protect, admin, directChangePassword);

module.exports = router;