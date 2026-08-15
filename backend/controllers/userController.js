const User = require('../models/User');
const Post = require('../models/Post');

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
        const students = await User.find({}).select('-password');
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
        const users = await User.find({ ...keyword, _id: { $ne: req.user._id } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error searching users' });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
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

const toggleFollowUser = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!targetUser) return res.status(404).json({ message: 'User not found' });
        
        if (targetUser._id.toString() === currentUser._id.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const isFollowing = currentUser.following.includes(targetUser._id);

        if (isFollowing) {
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
        } else {
            currentUser.following.push(targetUser._id);
            targetUser.followers.push(currentUser._id);
        }

        await currentUser.save();
        await targetUser.save();

        res.json({ message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating follow status' });
    }
};

module.exports = { getUserProfile, updateUserProfile, getAllStudents, searchUsers, getUserById, toggleFollowUser };