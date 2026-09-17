const express = require('express');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const controller = require('../controllers/communityController');

const router = express.Router();
router.get('/', protect, controller.listCommunities);
router.get('/:id', protect, controller.getCommunity);
router.post('/:id/join', protect, controller.joinCommunity);
router.delete('/:id/leave', protect, controller.leaveCommunity);
router.get('/:id/members', protect, controller.getMembers);
router.get('/:id/posts', protect, controller.getCommunityPosts);
router.post('/:id/posts', protect, controller.createCommunityPost);
router.get('/:id/announcements', protect, controller.getCommunityAnnouncements);
router.post('/:id/announcements', protect, controller.createCommunityPost);
router.get('/:id/events', protect, controller.getCommunityEvents);
router.post('/:id/events', protect, controller.createCommunityEvent);
router.delete('/:id/events/:eventId', protect, controller.deleteCommunityEvent);
router.get('/:id/resources', protect, controller.getCommunityResources);
router.post('/:id/resources', protect, upload.single('file'), controller.createCommunityResource);
router.delete('/:id/resources/:resourceId', protect, controller.deleteCommunityResource);
router.patch('/:id/members/:userId', protect, controller.manageMember);
router.delete('/:id/members/:userId', protect, controller.removeMember);
router.post('/admin', protect, admin, controller.createCommunity);
router.put('/admin/:id', protect, admin, controller.updateCommunity);

module.exports = router;