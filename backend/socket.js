const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Conversation = require('./models/Conversation');

const activeUsers = new Map();

const addSocket = (userId, socketId) => {
    const sockets = activeUsers.get(userId) || new Set();
    sockets.add(socketId);
    activeUsers.set(userId, sockets);
};

const removeSocket = (userId, socketId) => {
    const sockets = activeUsers.get(userId);
    if (!sockets) return false;
    sockets.delete(socketId);
    if (sockets.size === 0) activeUsers.delete(userId);
    return sockets.size === 0;
};

const setupSocket = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Not authorized'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('_id name role');
            if (!user) return next(new Error('User not found'));
            if (user.role === 'admin') return next(new Error('Admin accounts do not use student chat'));
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Not authorized'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        const wasOffline = !activeUsers.has(userId);
        addSocket(userId, socket.id);
        socket.join(`user:${userId}`);
        if (wasOffline) io.emit('user:online', { userId });

        socket.on('conversation:join', async (conversationId, callback) => {
            try {
                const conversation = await Conversation.findOne({ _id: conversationId, participants: socket.user._id }).select('_id participants');
                if (!conversation) return callback?.({ ok: false, message: 'Conversation not found' });
                const hasAdmin = await User.exists({ _id: { $in: conversation.participants }, role: 'admin' });
                if (hasAdmin) return callback?.({ ok: false, message: 'Admin accounts are not available in student chat' });
                socket.join(`conversation:${conversation._id}`);
                callback?.({ ok: true });
            } catch (error) {
                callback?.({ ok: false, message: 'Unable to join conversation' });
            }
        });

        socket.on('conversation:leave', (conversationId) => {
            socket.leave(`conversation:${conversationId}`);
        });

        const relayTyping = async (eventName, conversationId) => {
            const conversation = await Conversation.findOne({ _id: conversationId, participants: socket.user._id }).select('_id participants');
            const hasAdmin = conversation && await User.exists({ _id: { $in: conversation.participants }, role: 'admin' });
            if (conversation && !hasAdmin) socket.to(`conversation:${conversation._id}`).emit(eventName, { conversationId, userId, name: socket.user.name });
        };
        socket.on('typing:start', conversationId => relayTyping('typing:start', conversationId).catch(() => {}));
        socket.on('typing:stop', conversationId => relayTyping('typing:stop', conversationId).catch(() => {}));
        socket.on('message:send', ({ conversationId } = {}) => {
            socket.to(`conversation:${conversationId}`).emit('message:send', { conversationId, userId });
        });
        socket.on('message:read', ({ conversationId } = {}) => {
            socket.to(`conversation:${conversationId}`).emit('message:read', { conversationId, userId });
        });

        socket.on('disconnect', () => {
            if (removeSocket(userId, socket.id)) io.emit('user:offline', { userId });
        });
    });
};

module.exports = { setupSocket, activeUsers };