const { Server } = require('socket.io');
const User = require('../models/User.model');
const Message = require('../models/Message.model');
const handleVideoCallEvent = require('./video-call-events');
const socketMiddleware = require('../middleware/socketMiddleware');

//Map to store online users -> userId , socketID
const onlineUsers = new Map();

//MAp to track typing status -> userId -> [conversation]:boolean
const typingUsers = new Map();

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
    pingTimeout: 6000,
  });

  io.use(socketMiddleware);

  // when a new socket connection is established
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    let userId = null;

    //handle user connection and mark them online in db
    socket.on('user_connected', async (connectingUserId) => {
      if (!connectingUserId) {
        console.error(
          "Received 'user_connected' event with a null or undefined userId. Aborting.",
        );
        return; // This stops the function here and prevents the crash
      }

      try {
        userId = connectingUserId;
        socket.userId = userId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId);

        //update user status in db
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        //notify all users that this user is now online
        io.emit('user_status', {
          userId,
          isOnline: true,
        });
      } catch (error) {
        console.log('Error handling user connection', error);
      }
    });

    // Return online status of requested user
    socket.on('get_user_status', (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId);
      callback({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    socket.on('send_message', async ({ senderId, receiverId, content }) => {
      try {
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
        });

        const populatedMessage = await newMessage.populate([
          { path: 'sender', select: 'username profilePicture' },
          { path: 'receiver', select: 'username profilePicture' },
        ]);

        // --- Send to sender immediately ---
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('receive_message', populatedMessage);
        }

        // --- Send to receiver if online ---
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', populatedMessage);
        }
      } catch (error) {
        console.error('Error sending message', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    socket.on('message_read', async ({ messageIds, receiverId }) => {
      try {
        // 1. Update the messages in the database
        await Message.updateMany(
          { _id: { $in: messageIds }, receiver: receiverId }, // Ensure security
          { $set: { messageStatus: 'read' } },
        );

        // 2. Find the messages to get their senders
        const messages = await Message.find({ _id: { $in: messageIds } })
          .select('sender')
          .lean();

        // 3. Create a map of senderId -> array of their messageIds that were read
        const senderMessageMap = {};
        messages.forEach((msg) => {
          const senderId = msg.sender.toString();
          if (!senderMessageMap[senderId]) {
            senderMessageMap[senderId] = [];
          }
          senderMessageMap[senderId].push(msg._id);
        });

        // 4. Notify each unique sender about their specific messages
        for (const senderId in senderMessageMap) {
          const senderSocketId = onlineUsers.get(senderId);
          if (senderSocketId) {
            const readMessageIds = senderMessageMap[senderId];
            io.to(senderSocketId).emit('messages_status_updated', {
              messageIds: readMessageIds,
              messageStatus: 'read',
            });

            readMessageIds.forEach((id) => {
              io.to(senderSocketId).emit('message_status_updated', {
                messageId: id,
                messageStatus: 'read',
              });
            });
          }
        }
      } catch (error) {
        console.error('Error updating message read status', error);
      }
    });

    //handle typing start event and auto-stop after 3s
    socket.on('typing_start', ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (!typingUsers.has(userId)) typingUsers.set(userId, {});
      const userTyping = typingUsers.get(userId);

      userTyping[conversationId] = true;

      //clear an existing timeout
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      //auto-stop after 3s
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        io.to(receiverId).emit('user_typing', {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 3000);

      //Notify receiver
      io.to(receiverId).emit('user_typing', {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;
      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      io.to(receiverId).emit('user_typing', {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    //Add or Update reaction to a message
    socket.on('add_reaction', async ({ messageId, emoji, userId: reactionUserId }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;

          const existingIndex = message.reactions.findIndex(
            (r) => r.user.toString() === reactionUserId,
          );

          if (existingIndex > -1) {
            const existing = message.reactions[existingIndex];
            if (existing.emoji === emoji) {
              //remove same reaction
              message.reactions.splice(existingIndex, 1);
            } else {
              //change emoji
              message.reactions[existingIndex].emoji = emoji;
            }
          } else {
            //add new reaction
            message.reactions.push({ user: reactionUserId, emoji });
          }

          await message.save();

          const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username profilePicture')
            .populate('receiver', 'username profilePicture')
            .populate('reactions.user', 'username');

          const reactionUpdated = {
            messageId,
            reactions: populatedMessage.reactions,
          };

          const senderSocket = onlineUsers.get(
            populatedMessage.sender._id.toString(),
          );
          const receiverSocket = onlineUsers.get(
            populatedMessage.receiver?._id.toString(),
          );

          if (senderSocket)
            io.to(senderSocket).emit('reaction_updated', reactionUpdated);
          if (receiverSocket)
            io.to(receiverSocket).emit('reaction_updated', reactionUpdated);
        } catch (error) {
          console.log('Error handling reaction', error);
        }
      },
    );

    //handle video call events
    handleVideoCallEvent(socket, io, onlineUsers);

    //handle disconnection and mark user offline
    const handleDisconnected = async () => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        //clear all typing timeouts
        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith('_timeout')) clearTimeout(userTyping[key]);
          });

          typingUsers.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit('user_status', {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId);
        console.log(`user ${userId} disconnected`);
      } catch (error) {
        console.error('Error handling disconnection', error);
      }
    };

    //disconection event
    socket.on('disconnect', handleDisconnected);
  });

  //attach the online user map to the socket server for external user
  io.socketUserMap = onlineUsers;
  return io;
};

module.exports = initializeSocket;
