const express = require('express');
const { sendOtp, verifyOtp, updateProfile, logout, checkAuthenticate, getAllUsers } = require('../controllers/auth.controllers');
const { authMiddleware } = require('../middleware/authMiddleware');
const { multerMiddleware } = require('../config/cloudinaryConfig');
const { sendMessage, getConversation, getMessages, markAsRead, deleteMessage } = require('../controllers/chatController');

const router = express.Router();

router.post('/send-message',authMiddleware,multerMiddleware,sendMessage);
router.get('/conversations',authMiddleware,getConversation);
router.get('/conversations/:conversationId/messages',authMiddleware,getMessages);

router.put('/messages/read',authMiddleware,markAsRead)

router.delete('/messages/:messagesId',authMiddleware,deleteMessage)

module.exports = router