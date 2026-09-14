const express = require('express');
const {
    getConversations, createConversation, getMessages, sendMessage, markRead,
    deleteMessage, updateMessage, blockUser, unblockUser, createReport, getReports, updateReport
} = require('../controllers/chatController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();
const studentChatOnly = (req, res, next) => {
    if (req.user?.role === 'admin') {
        return res.status(403).json({ message: 'Admin accounts do not use student chat.' });
    }
    next();
};

router.route('/conversations')
    .get(protect, studentChatOnly, getConversations)
    .post(protect, studentChatOnly, createConversation);
router.route('/conversations/:conversationId/messages')
    .get(protect, studentChatOnly, getMessages)
    .post(protect, studentChatOnly, sendMessage);
router.patch('/conversations/:conversationId/read', protect, studentChatOnly, markRead);
router.delete('/messages/:messageId', protect, studentChatOnly, deleteMessage);
router.put('/messages/:messageId', protect, studentChatOnly, updateMessage);
router.put('/users/:userId/block', protect, studentChatOnly, blockUser);
router.delete('/users/:userId/block', protect, studentChatOnly, unblockUser);
router.post('/reports', protect, createReport);
router.get('/reports', protect, admin, getReports);
router.patch('/reports/:reportId', protect, admin, updateReport);

module.exports = router;