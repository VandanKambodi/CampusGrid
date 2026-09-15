const User = require('../models/User');
const Post = require('../models/Post');

const isSafeHttpUrl = (value) => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;

    try {
        const parsed = new URL(trimmed);
        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(parsed.protocol)) return false;
        if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') return false;
        return true;
    } catch (error) {
        return false;
    }
};

const sanitizeProfileUrl = (value, hostPattern) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (!isSafeHttpUrl(trimmed)) return '';

    const normalized = trimmed.toLowerCase();
    if (hostPattern && !normalized.includes(hostPattern)) {
        return '';
    }

    return trimmed;
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            const userPosts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
            res.json({ ...user._doc, posts: userPosts });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.course = req.body.course || user.course;
            user.branch = req.body.branch || user.branch;
            
            if (req.body.techStack) user.techStack = req.body.techStack;
            if (req.body.projects) user.projects = req.body.projects;
            if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;

            user.portfolioUrl = sanitizeProfileUrl(req.body.portfolioUrl, '');
            user.linkedinUrl = sanitizeProfileUrl(req.body.linkedinUrl, 'linkedin.com');
            user.githubUrl = sanitizeProfileUrl(req.body.githubUrl, 'github.com');

            const updatedUser = await user.save();

            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({}).select('-password -blockedUsers');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const searchUsers = async (req, res) => {
    const keyword = req.query.keyword ? {
        $or: [
            { name: { $regex: req.query.keyword, $options: 'i' } },
            { rollNo: { $regex: req.query.keyword, $options: 'i' } }
        ]
    } : {};

    try {
        const users = await User.find({ ...keyword, _id: { $ne: req.user._id } }).select('-password -blockedUsers');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error searching users' });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -blockedUsers');
        if (user) {
            const userPosts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
            res.json({ profile: user, posts: userPosts });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Invalid User ID' });
    }
};

const getUserFollowList = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('followers following').populate({
            path: 'followers',
            select: 'name rollNo branch course profilePicture'
        }).populate({
            path: 'following',
            select: 'name rollNo branch course profilePicture'
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.json({
            followers: user.followers || [],
            following: user.following || []
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching follow list' });
    }
};

const toggleFollowUser = async (req, res) => {
    try {
        if (!req.params.id || !req.user?._id) {
            return res.status(400).json({ message: 'Invalid user request' });
        }

        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!targetUser) return res.status(404).json({ message: 'User not found' });
        if (!currentUser) return res.status(404).json({ message: 'Current user not found' });
        if (targetUser._id.toString() === currentUser._id.toString()) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const isFollowing = currentUser.following.some(id => id.toString() === targetUser._id.toString());

        if (isFollowing) {
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
        } else {
            currentUser.following.push(targetUser._id);
            targetUser.followers.push(currentUser._id);
        }

        await currentUser.save();
        await targetUser.save();

        res.json({
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            following: currentUser.following,
            followers: targetUser.followers
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating follow status' });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getAllStudents,
    searchUsers,
    getUserById,
    getUserFollowList,
    toggleFollowUser
};