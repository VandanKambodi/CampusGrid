const Post = require('../models/Post');
const CommunityMembership = require('../models/CommunityMembership');

const canAccessCommunityPost = async (post, userId) => {
    if (!post.community) return true;
    const membership = await CommunityMembership.findOne({ community: post.community, user: userId });
    return Boolean(membership);
};

const createPost = async (req, res) => {
    const { type, title, content, itemStatus } = req.body;

    if (type === 'announcement' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can post announcements.' });
    }

    let imagePaths = [];
    if (req.files && req.files.length > 0) {
        imagePaths = req.files.map(file => file.path); 
    }

    try {
        const post = await Post.create({
            author: req.user._id,
            type,
            title,
            content,
            images: imagePaths,
            itemStatus: type === 'lost-found' ? (itemStatus || 'lost') : null
        });

        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getPosts = async (req, res) => {
    const { type } = req.query; 

    let query = { community: req.query.community || null };
    if (type) query.type = type;

    try {
        const posts = await Post.find(query)
            .populate('author', 'name rollNo profilePicture branch') 
            .populate('comments.user', 'name profilePicture') 
            .sort({ createdAt: -1 }); 

        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching posts' });
    }
};

const toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (!await canAccessCommunityPost(post, req.user._id)) return res.status(403).json({ message: 'Join the community to interact with this discussion.' });

        const alreadyLiked = post.likes.includes(req.user._id);

        if (alreadyLiked) {
            post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
        }

        await post.save();
        res.json({ message: alreadyLiked ? 'Post unliked' : 'Post liked', likesCount: post.likes.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addComment = async (req, res) => {
    const { text } = req.body;

    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (!await canAccessCommunityPost(post, req.user._id)) return res.status(403).json({ message: 'Join the community to interact with this discussion.' });

        const newComment = {
            user: req.user._id,
            text
        };

        post.comments.push(newComment);
        await post.save();

        res.status(201).json(post.comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const isAuthor = post.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePost = async (req, res) => {
    const { title, content, itemStatus } = req.body;

    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const isAuthor = post.author.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin' || req.user.isAdmin;
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        post.title = title.trim();
        post.content = content.trim();
        if (post.type === 'lost-found' && itemStatus) post.itemStatus = itemStatus;

        await post.save();
        await post.populate('author', 'name rollNo profilePicture branch');
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createPost, getPosts, toggleLike, addComment, deletePost, updatePost };