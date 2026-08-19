const express = require('express');
const router = express.Router();
const { createPost, getPosts, toggleLike, addComment, deletePost } = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Route to get feed and create a post
router.route('/')
    .get(protect, getPosts)
    .post(protect, upload.array('images', 3), createPost);

// Interaction Routes
router.delete('/:id', protect, deletePost);
router.put('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);

module.exports = router;