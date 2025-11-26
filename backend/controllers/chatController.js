const response = require('../utils/responseHandler.utils');
const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');
const Conversation = require('../models/Conversation.model');
const Message = require('../models/Message.model');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageStatus } = req.body;
    const senderId = req.user.userId;
    const file = req.file;

    // TODO :- make it like a whatup self sending chat later
    // For now (temp)
    if (senderId === receiverId) {
      return response(res, 400, 'You cannot send a message to yourself.');
    }

    const participants = [senderId, receiverId].sort();

    let conversation = await Conversation.findOne({
      participants: participants,
    });

    if (!conversation) {
      conversation = new Conversation({
        participants,
      });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = null;

    //handle file upload
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);

      if (!uploadFile?.secure_url) {
        return response(res, 400, 'Failed to upload media');
      }

      imageOrVideoUrl = uploadFile?.secure_url;

      if (file.mimetype.startsWith('image')) {
        contentType = 'image';
      } else if (file.mimetype.startsWith('video')) {
        contentType = 'video';
      } else {
        return response(res, 400, 'Unsupported file type');
      }
    } else if (content?.trim()) {
      contentType = 'text';
    } else {
      return response(res, 400, 'Message content is required');
    }

    const message = new Message({
      conversation: conversation?._id,
      sender: senderId,
      receiver: receiverId,
      content,
      contentType,
      imageOrVideoUrl,
      messageStatus,
    });

    await message.save();

    if (message?.content) {
      conversation.lastMessage = message?._id;
    }
    conversation.unreadCount += 1;
    await conversation.save();

    const populatedMessage = await Message.findOne(message?._id)
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture');

    //Emit socket event
    if (req.io && req.socketUserMap) {
      const senderSocketId = req.socketUserMap.get(senderId);
      const receiverSocketId = req.socketUserMap.get(receiverId);

      const sockets = [senderSocketId, receiverSocketId].filter(Boolean);
      sockets.forEach((socketId) => {
        req.io.to(socketId).emit('receive_message', populatedMessage);
      });

      message.messageStatus = receiverSocketId ? 'delivered' : 'send';
      await message.save();
    }

    return response(res, 201, 'Message send successfully', populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, 'Internal server error');
  }
};

//get all conversation
exports.getConversation = async (req, res) => {
  const userId = req.user.userId;

  try {
    let conversation = await Conversation.find({
      participants: userId,
      //populate participants : instead of object_Id :- username profilePicture isOnline lastSeen
    })
      .populate('participants', 'username profilePicture isOnline lastSeen')
      .populate({
        //nested populate :- lastseen populate :- on sender and receiver :- populate with their username and profilePicture
        path: 'lastMessage',
        populate: {
          path: 'sender receiver',
          select: 'username profilePicture',
        },
      })
      .sort({ updatedAt: -1 });

    return response(
      res,
      200,
      'Conversation fetched successfully',
      conversation,
    );
  } catch (error) {
    console.error(error);
    return response(res, 500, 'GET_CONVERSATION_ERROR:: || server error');
  }
};

exports.getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.userId;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return response(res, 404, 'Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
      return response(res, 403, 'Not authorized to view this conversation');
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')
      .sort('createdAt');

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ['send', 'delivered'] },
      },
      { $set: { messageStatus: 'read' } },
    );

    conversation.unreadCount = 0;
    await conversation.save();

    return response(res, 200, 'Message retrieved successfully', messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, 'GET_MESSAGE_ERROR:: || Internal sever error');
  }
};

exports.markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userId;

  try {
    let messages = await Message.find({
      _id: { $in: messageIds },
      receiver: userId,
    });

    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: userId },
      { $set: { messageStatus: 'read' } },
    );

    //notify to original sender
    if (req.io && req.socketUserMap) {
      for (const message of messages) {
        const senderSocketId = req.socketUserMap.get(message.sender.toString());
        if (senderSocketId) {
          const updatedMessage = {
            _id: message._id,
            messageStatus: 'read',
          };
          req.io.to(senderSocketId).emit('message_read', updatedMessage);
          await message.save();
        }
      }
    }

    return response(res, 200, 'MessageIds marked as read', messages);
  } catch (error) {
    console.error(error);
    response(res, 500, 'MARK_AS_READ_ERROR:: || Internal sever error');
  }
};

exports.deleteMessage = async (req, res) => {
  const { messagesId } = req.params;
  const userId = req.user.userId;
  try {
    const message = await Message.findById(messagesId);
    if (!message) {
      return response(res, 404, 'Message not found');
    }

    if (message.sender.toString() !== userId) {
      return response(res, 403, 'Not authorized to delete this message');
    }

    await message.deleteOne();

    //Emit socket event
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(
        message.receiver.toString(),
      );
      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit('message_deleted', messagesId);
      }
    }

    return response(res, 200, 'Message deleted successfully');
  } catch (error) {
    console.error(error);
    response(res, 500, 'DELETE_MESSAGE_ERROR:: || Internal sever error');
  }
};
