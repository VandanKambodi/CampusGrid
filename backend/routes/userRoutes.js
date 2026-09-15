const express = require('express');
const router = express.Router();
const { 
    getUserProfile, 
    updateUserProfile, 
    getAllStudents, 
    searchUsers,
    getUserById,
    getUserFollowList,
    toggleFollowUser
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Get all students 
router.get('/', protect, getAllStudents);

// Search Route
router.get('/search', protect, searchUsers);

// My Profile 
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.get('/:id/followers', protect, getUserFollowList);
router.get('/:id/following', protect, getUserFollowList);

// Get another user's public profile
router.get('/:id', protect, getUserById);

// Follow / Unfollow Route
router.put('/:id/follow', protect, toggleFollowUser);

module.exports = router;