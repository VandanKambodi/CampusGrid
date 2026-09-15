const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Report = require('../models/Report');
const User = require('../models/User');

const publicUserFields = 'name profilePicture rollNo course branch';
const getParticipantKey = (firstId, secondId) => [firstId.toString(), secondId.toString()].sort().join(':');
const isBlocked = (user, otherUser) => user.blockedUsers?.some(id => id.toString() === otherUser.toString());

const getConversationForUser = async (conversationId, userId) => {
    if (!mongoose.isValidObjectId(conversationId)) return null;
    const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
    if (!conversation) return null;
    const containsAdmin = await User.exists({ _id: { $in: conversation.participants }, role: 'admin' });
    return containsAdmin ? null : conversation;
};

const serializeConversation = async (conversation, userId, currentUser = null) => {
    const otherUser = conversation.participants.find(user => user._id.toString() !== userId.toString());
    const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        receiver: userId,
        read: false,
        deleted: false
    });

    return {
        _id: conversation._id,
        otherUser,
        blockedByMe: currentUser ? isBlocked(currentUser, otherUser._id) : false,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount
    };
};

const getConversations = async (req, res) => {
    try {
        const adminUsers = await User.find({ role: 'admin' }).select('_id');
        const conversations = await Conversation.find({
            $and: [
                { participants: req.user._id },
                { participants: { $nin: adminUsers.map(user => user._id) } }
            ]
        })
            .populate('participants', publicUserFields)
            .populate('lastMessage', 'sender receiver content messageType read deleted createdAt')
            .sort({ lastMessageAt: -1, updatedAt: -1 });

        res.json(await Promise.all(conversations.map(conversation => serializeConversation(conversation, req.user._id, req.user))));
    } catch (error) {
        res.status(500).json({ message: 'Unable to load conversations' });
    }
};

const createConversation = async (req, res) => {
    const { userId } = req.body;

    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid user ID' });
    if (userId.toString() === req.user._id.toString()) return res.status(400).json({ message: 'You cannot message yourself' });

    try {
        const targetUser = await User.findById(userId).select(`${publicUserFields} role`);
        if (!targetUser) return res.status(404).json({ message: 'Student not found' });
        if (targetUser.role === 'admin') return res.status(403).json({ message: 'Students cannot start chats with admin accounts' });
        if (isBlocked(req.user, targetUser._id) || isBlocked(targetUser, req.user._id)) {
            return res.status(403).json({ message: 'Messaging is unavailable for this student' });
        }

        const participantKey = getParticipantKey(req.user._id, targetUser._id);
        let conversation = await Conversation.findOne({ participantKey })
            .populate('participants', publicUserFields)
            .populate('lastMessage', 'sender receiver content messageType read deleted createdAt');

        if (!conversation) {
            try {
                conversation = await Conversation.create({
                    participants: [req.user._id, targetUser._id],
                    participantKey
                });
                conversation = await Conversation.findById(conversation._id).populate('participants', publicUserFields);
            } catch (error) {
                if (error.code !== 11000) throw error;
                conversation = await Conversation.findOne({ participantKey })
                    .populate('participants', publicUserFields)
                    .populate('lastMessage', 'sender receiver content messageType read deleted createdAt');
            }
        }

        res.status(200).json(await serializeConversation(conversation, req.user._id, req.user));
    } catch (error) {
        res.status(500).json({ message: 'Unable to open conversation' });
    }
};

const getMessages = async (req, res) => {
    try {
        const conversation = await getConversationForUser(req.params.conversationId, req.user._id);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 30, 1), 50);
        const messages = await Message.find({ conversation: conversation._id })
            .populate('sender', publicUserFields)
            .populate('receiver', publicUserFields)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ messages: messages.reverse(), page, limit, hasMore: messages.length === limit });
    } catch (error) {
        res.status(500).json({ message: 'Unable to load messages' });
    }
};

const sendMessage = async (req, res) => {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content) return res.status(400).json({ message: 'Message cannot be empty' });
    if (content.length > 2000) return res.status(400).json({ message: 'Message cannot exceed 2000 characters' });

    try {
        const conversation = await getConversationForUser(req.params.conversationId, req.user._id);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        const receiverId = conversation.participants.find(id => id.toString() !== req.user._id.toString());
        const receiver = await User.findById(receiverId).select('blockedUsers');
        if (!receiver || isBlocked(req.user, receiverId) || isBlocked(receiver, req.user._id)) {
            return res.status(403).json({ message: 'Messaging is unavailable for this student' });
        }

        const message = await Message.create({
            conversation: conversation._id,
            sender: req.user._id,
            receiver: receiverId,
            content,
            messageType: 'text'
        });
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = message.createdAt;
        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', publicUserFields)
            .populate('receiver', publicUserFields);
        const io = req.app.get('io');
        if (io) {
            io.to(`conversation:${conversation._id}`).emit('message:receive', populatedMessage);
            io.to(`user:${receiverId}`).emit('message:receive', populatedMessage);
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Message failed to send' });
    }
};

const markRead = async (req, res) => {
    try {
        const conversation = await getConversationForUser(req.params.conversationId, req.user._id);
        if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

        await Message.updateMany({ conversation: conversation._id, receiver: req.user._id, read: false }, { $set: { read: true } });
        const io = req.app.get('io');
        if (io) io.to(`conversation:${conversation._id}`).emit('message:read', { conversationId: conversation._id, userId: req.user._id });
        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Unable to mark messages as read' });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findOne({ _id: req.params.messageId, sender: req.user._id });
        if (!message) return res.status(404).json({ message: 'Message not found or not owned by you' });
        message.deleted = true;
        message.content = 'Message deleted';
        await message.save();
        const io = req.app.get('io');
        if (io) io.to(`conversation:${message.conversation}`).emit('message:deleted', { messageId: message._id, conversationId: message.conversation });
        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Unable to delete message' });
    }
};

const updateMessage = async (req, res) => {
    const content = req.body.content?.trim();
    if (!content) return res.status(400).json({ message: 'Message content is required' });
    if (content.length > 2000) return res.status(400).json({ message: 'Message cannot exceed 2000 characters' });

    try {
        const message = await Message.findOne({ _id: req.params.messageId, sender: req.user._id, deleted: false });
        if (!message) return res.status(404).json({ message: 'Message not found or not owned by you' });

        message.content = content;
        message.edited = true;
        await message.save();
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', publicUserFields)
            .populate('receiver', publicUserFields);
        const io = req.app.get('io');
        if (io) io.to(`conversation:${message.conversation}`).emit('message:updated', populatedMessage);
        res.json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Unable to edit message' });
    }
};

const blockUser = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.userId) || req.params.userId === req.user._id.toString()) {
        return res.status(400).json({ message: 'Invalid student' });
    }
    try {
        const target = await User.findById(req.params.userId).select('_id');
        if (!target) return res.status(404).json({ message: 'Student not found' });
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: target._id } });
        res.json({ message: 'Student blocked' });
    } catch (error) {
        res.status(500).json({ message: 'Unable to block student' });
    }
};

const unblockUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: req.params.userId } });
        res.json({ message: 'Student unblocked' });
    } catch (error) {
        res.status(500).json({ message: 'Unable to unblock student' });
    }
};

const createReport = async (req, res) => {
    const { reportedUser, conversation, reason, description } = req.body;
    const allowedReasons = ['spam', 'harassment', 'inappropriate content', 'fake account', 'other'];
    if (!mongoose.isValidObjectId(reportedUser) || !allowedReasons.includes(reason)) {
        return res.status(400).json({ message: 'Invalid report details' });
    }
    try {
        if (reportedUser === req.user._id.toString()) return res.status(400).json({ message: 'You cannot report yourself' });
        if (conversation) {
            const authorizedConversation = await getConversationForUser(conversation, req.user._id);
            if (!authorizedConversation || !authorizedConversation.participants.some(id => id.toString() === reportedUser)) {
                return res.status(403).json({ message: 'Conversation not found' });
            }
        }
        const report = await Report.create({ reportedBy: req.user._id, reportedUser, conversation: conversation || null, reason, description });
        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: 'Unable to submit report' });
    }
};

const getReports = async (req, res) => {
    try {
        const reports = await Report.find().populate('reportedBy reportedUser', publicUserFields).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Unable to load reports' });
    }
};

const updateReport = async (req, res) => {
    if (!['reviewed', 'resolved'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid report status' });
    try {
        const report = await Report.findByIdAndUpdate(req.params.reportId, { status: req.body.status }, { new: true })
            .populate('reportedBy reportedUser', publicUserFields);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Unable to update report' });
    }
};

module.exports = {
    getConversations, createConversation, getMessages, sendMessage, markRead,
    deleteMessage, updateMessage, blockUser, unblockUser, createReport, getReports, updateReport
};