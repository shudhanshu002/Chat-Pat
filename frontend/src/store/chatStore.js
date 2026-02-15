import { create } from 'zustand';
import {initializeSocket, disconnectSocket} from '../services/chat.service'
import axiosInstance from '../services/url.service';

export const useChatStore = create((set, get) => ({
  socket: null,
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  lastMessages: {},
  error: null,
  onlineUsers: new Map(),
  typingUsers: new Map(),

  connectSocket: (user) => {
    if (get().socket) return; 

    const newSocket = initializeSocket(); 
    set({ socket: newSocket, currentUser: user });
    get().initializeListners();
    newSocket.emit('user_connected', user._id);
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      disconnectSocket(socket);
      get().cleanup();
      set({ socket: null, currentUser: null });
    }
  },

  initializeListners: () => {
    const {socket} = get();
    if (!socket) return;

    socket.off('receive_message');
    socket.off('user_typing');
    socket.off('user_status');
    socket.off('message_send');
    socket.off('message_error');
    socket.off('message_deleted');
    socket.off('messages_status_updated');

    socket.on('messages_status_updated', ({ messageIds, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, messageStatus } : msg,
        ),
      }));
    });

    socket.on('receive_message', (message) => {
      get().receiveMessage(message);
    });

    socket.on('message_send', (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id ? { ...msg } : msg,
        ),
      }));
    });

    socket.on('reactions_update', ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg,
        ),
      }));
    });


    socket.on('message_deleted', (payload) => {
      const deletedId =
        typeof payload === 'string'
          ? payload
          : payload?.deletedMessageId || payload?.messageId || null;
      if (!deletedId) return;
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== deletedId),
      }));
    });

    socket.on('message_error', (error) => {
      console.error('message error', error);
    });

    socket.on('user_typing', ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }
        const typingSet = newTypingUsers.get(conversationId);
        if (isTyping) {
          typingSet.add(userId);
        } else {
          typingSet.delete(userId);
        }

        return { typingUsers: newTypingUsers };
      });
    });

    socket.on('user_status', ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });

    const { conversations } = get();
    if (conversations?.data?.length > 0) {
      conversations.data?.forEach((conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id !== get().currentUser._id,
        );

        if (otherUser?._id) {
          socket.emit('get_user_status', otherUser._id, (status) => {
            set((state) => {
              const newOnlineUsers = new Map(state.onlineUsers);
              newOnlineUsers.set(status.userId, {
                isOnline: status.isOnline,
                lastSeen: status.lastSeen,
              });
              return { onlineUsers: newOnlineUsers };
            });
          });
        }
      });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get('/chats/conversations');
      set({ conversations: data, loading: false });

      get().initializeListners();
      return data;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return null;
    }
  },

  fetchMessages: async (conversationId) => {
    if (!conversationId) return;
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        `/chats/conversations/${conversationId}/messages`,
      );
      const messageArray = data.data || data || [];
      set({
        messages: messageArray,
        currentConversation: conversationId,
        loading: false,
      });

      return messageArray;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return [];
    }
  },

  // sendMessage: async (formData) => {
  //   const senderId = formData.get('senderId');
  //   const receiverId = formData.get('receiverId');
  //   const media = formData.get('media');
  //   const content = formData.get('content');
  //   const messageStatus = formData.get('messageStatus');

  //   const socket = getSocket();

  //   const { conversations } = get();
  //   let conversationId = null;
  //   if (conversations?.data?.length > 0) {
  //     const conversation = conversations.data.find(
  //       (conv) =>
  //         conv.participants.some((p) => p._id === senderId) &&
  //         conv.participants.some((p) => p._id === receiverId),
  //     );
  //     if (conversation) {
  //       conversationId = conversation._id;
  //       set({ currentConversation: conversationId });
  //     }
  //   }

  //   const tempId = `temp-${Date.now()}`;
  //   const optimisticMessage = {
  //     _id: tempId,
  //     sender: { _id: senderId },
  //     receiver: { _id: receiverId },
  //     conversation: conversationId,
  //     imageOrVideoUrl:
  //       media && typeof media !== 'string' ? URL.createObjectURL(media) : null,
  //     content: content,
  //     contentType: media
  //       ? media.type.startsWith('image')
  //         ? 'image'
  //         : 'video'
  //       : 'text',
  //     createdAt: new Date().toString(),
  //     messageStatus,
  //   };

  //   set((state) => ({
  //     messages: [...state.messages, optimisticMessage],
  //   }));

  //   try {
  //     const { data } = await axiosInstance.post(
  //       '/chats/send-message',
  //       formData,
  //       { headers: { 'Content-Type': 'multipart/form-data' } },
  //     );
  //     const messageData = data.data || data;

  //     set((state) => ({
  //       messages: state.messages.map((msg) =>
  //         msg._id === tempId ? messageData : msg,
  //       ),
  //       lastMessages: {
  //         ...state.lastMessages,
  //         [messageData.conversation]: messageData,
  //       },
  //     }));
  //     return messageData;
  //   } catch (error) {
  //     console.error('Error sending message', error);
  //     set((state) => ({
  //       messages: state.messages.map((msg) =>
  //         msg._id === tempId ? { ...msg, messageStatus: 'failed' } : msg,
  //       ),
  //       error: error?.response?.data?.message || error?.message,
  //     }));
  //     throw error;
  //   }
  // },

  // receiveMessage: (message) => {
  //   if (!message) return;

  //   const { currentConversation, currentUser, messages } = get();

  //   // Avoid duplicates
  //   if (messages.some((msg) => msg._id === message._id)) return;

  //   const isCurrentOpen = message.conversation === currentConversation;
  //   const isReceiver = message.receiver?._id === currentUser?._id;

  //   set((state) => {
  //     // 1️⃣ Update messages if current conversation is open
  //     const updatedMessages = isCurrentOpen
  //       ? [...state.messages, message]
  //       : state.messages;

  //     // 2️⃣ Update conversations: lastMessage + unreadCount
  //     const updatedConversations = state.conversations?.data?.map((conv) => {
  //       if (conv._id === message.conversation) {
  //         return {
  //           ...conv,
  //           // Keep all old properties intact
  //           unreadCount: isCurrentOpen
  //             ? 0 // reset if chat is open
  //             : isReceiver
  //             ? (conv.unreadCount || 0) + 1 // increment if current user is receiver
  //             : conv.unreadCount || 0,
  //         };
  //       }
  //       return conv;
  //     });

  //     // 3️⃣ Update lastMessages (plural) without disturbing old properties
  //     const updatedLastMessages = {
  //       ...state.lastMessages,
  //       [message.conversation]: message,
  //     };

  //     return {
  //       messages: updatedMessages,
  //       conversations: {
  //         ...state.conversations,
  //         data: updatedConversations,
  //       },
  //       lastMessages: updatedLastMessages,
  //     };
  //   });

  //   // 4️⃣ If user is the receiver and chat is open, mark as read
  //   if (isCurrentOpen && isReceiver) {
  //     get().markMessagesAsRead();
  //   }
  // },

  sendMessage: async (formData) => {
    const senderId = formData.get('senderId');
    const receiverId = formData.get('receiverId');
    const media = formData.get('media');
    const content = formData.get('content');
    const messageStatus = formData.get('messageStatus');

    const {socket} = get();

    const { conversations } = get();
    let conversationId = null;
    if (conversations?.data?.length > 0) {
      const conversation = conversations.data.find(
        (conv) =>
          conv.participants.some((p) => p._id === senderId) &&
          conv.participants.some((p) => p._id === receiverId),
      );
      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: conversationId });
      }
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiver: { _id: receiverId },
      conversation: conversationId,
      imageOrVideoUrl:
        media && typeof media !== 'string' ? URL.createObjectURL(media) : null,
      content,
      contentType: media
        ? media.type.startsWith('image')
          ? 'image'
          : 'video'
        : 'text',
      createdAt: new Date().toISOString(),
      messageStatus: 'sending',
    };

    // add optimistic
    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const { data } = await axiosInstance.post(
        '/chats/send-message',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      const messageData = data.data || data;

      set((state) => {
        // remove temp
        const withoutTemp = state.messages.filter((m) => m._id !== tempId);

        // avoid duplicates if socket already delivered real msg
        const exists = withoutTemp.some((m) => m._id === messageData._id);

        return {
          messages: exists ? withoutTemp : [...withoutTemp, messageData],
          lastMessages: {
            ...state.lastMessages,
            [messageData.conversation]: messageData,
          },
        };
      });

      return messageData;
    } catch (error) {
      console.error('Error sending message', error);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? { ...msg, messageStatus: 'failed' } : msg,
        ),
        error: error?.response?.data?.message || error?.message,
      }));
      throw error;
    }
  },

  receiveMessage: (message) => {
    if (!message) return;

    const { currentConversation, currentUser, messages, conversations } = get();

    // Avoid duplicate messages
    if (messages.some((msg) => msg._id === message._id)) return;

    const isCurrentOpen = message.conversation === currentConversation;
    const isReceiver = message.receiver?._id === currentUser?._id;

    set((state) => {
      // 1️⃣ Update messages if chat is open
      const updatedMessages = isCurrentOpen
        ? [...state.messages, message]
        : state.messages;

      // 2️⃣ Update or add conversation in store
      let conversationExists = false;
      const updatedConversations = state.conversations?.data?.map((conv) => {
        if (conv._id === message.conversation) {
          conversationExists = true;
          return {
            ...conv,
            lastMessage: message,
            unreadCount: isCurrentOpen
              ? 0
              : isReceiver
              ? (conv.unreadCount || 0) + 1
              : conv.unreadCount || 0,
            updatedAt: new Date().toISOString(),
          };
        }
        return conv;
      });

      if (!conversationExists) {
        // Conversation not yet in frontend (after refresh)
        updatedConversations.push({
          _id: message.conversation,
          participants: [message.sender, message.receiver],
          lastMessage: message,
          unreadCount: isReceiver ? 1 : 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // 3️⃣ Update lastMessages map
      const updatedLastMessages = {
        ...state.lastMessages,
        [message.conversation]: message,
      };

      return {
        messages: updatedMessages,
        conversations: { ...state.conversations, data: updatedConversations },
        lastMessages: updatedLastMessages,
      };
    });

    // 4️⃣ If user opens chat, mark as read
    if (isCurrentOpen && isReceiver) get().markMessagesAsRead();
  },

  // markMessagesAsRead: async () => {
  //   const { messages, currentUser, currentConversation } = get();

  //   if (!messages.length || !currentUser || !currentConversation) return;
  //   const unreadIds = messages
  //     .filter(
  //       (msg) =>
  //         msg.messageStatus !== 'read' &&
  //         msg.receiver &&
  //         msg.receiver._id === currentUser._id &&
  //         msg.conversation === currentConversation,
  //     )
  //     .map((msg) => msg._id)
  //     .filter(Boolean);

  //   if (unreadIds.length === 0) return;

  //   try {
  //     await axiosInstance.put('/chats/messages/read', {
  //       messageIds: unreadIds,
  //     });

  //     set((state) => ({
  //       messages: state.messages.map((msg) =>
  //         unreadIds.includes(msg._id) ? { ...msg, messageStatus: 'read' } : msg,
  //       ),
  //     }));

  //     const socket = getSocket();
  //     if (socket) {
  //       socket.emit('message_read', {
  //         messageIds: unreadIds,
  //         receiverId: currentUser._id,
  //       });
  //     }
  //   } catch (error) {
  //     console.error('failed to mark as read ', error);
  //   }
  // },

  markMessagesAsRead: async () => {
    const { messages, currentUser, currentConversation, conversations } = get();
    if (!messages.length || !currentUser || !currentConversation) return;

    const unreadIds = messages
      .filter(
        (msg) =>
          msg.messageStatus !== 'read' && msg.receiver?._id === currentUser._id,
      )
      .map((msg) => msg._id)
      .filter(Boolean);

    if (unreadIds.length === 0) return;

    try {
      await axiosInstance.put('/chats/messages/read', {
        messageIds: unreadIds,
      });

      set((state) => {
        // update messages
        const updatedMessages = state.messages.map((msg) =>
          unreadIds.includes(msg._id) ? { ...msg, messageStatus: 'read' } : msg,
        );

        // update conversation unreadCount
        const updatedConversations = state.conversations?.data?.map((conv) => {
          if (conv._id === currentConversation) {
            return {
              ...conv,
              unreadCount: 0,
              lastMessage:
                updatedMessages.find((m) => m._id === conv.lastMessage?._id) ||
                conv.lastMessage,
            };
          }
          return conv;
        });

        return {
          messages: updatedMessages,
          conversations: { ...state.conversations, data: updatedConversations },
        };
      });

      // emit socket for sender to update messageStatus
      const {socket} = get();
      if (socket) {
        socket.emit('message_read', {
          messageIds: unreadIds,
          receiverId: currentUser._id,
        });
      }
    } catch (error) {
      console.error('Failed to mark messages as read', error);
    }
  },
  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/chats/messages/${messageId}`);

      set((state) => ({
        messages: state.messages?.filter((msg) => msg?._id !== messageId),
      }));
      return true;
    } catch (error) {
      console.log('error deleting msg', error);
      set({ error: error.response?.data?.message || error.message });
      return false;
    }
  },

  addReaction: async (messageId, emoji) => {
    const { socket } = get();
    const { currentUser } = get();

    if (socket && currentUser) {
      socket.emit('add_reaction', {
        messageId,
        emoji,
        userId: currentUser?._id,
      });
    }
  },

  startTyping: (receiverId) => {
    const { currentConversation } = get();
    const { socket } = get();
    if (socket && currentConversation && receiverId) {
      socket.emit('typing_start', {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  stopTyping: (receiverId) => {
    const { currentConversation } = get();
    const { socket } = get();
    if (socket && currentConversation && receiverId) {
      socket.emit('typing_stop', {
        conversationId: currentConversation,
        receiverId,
      });
    }
  },

  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    if (
      !currentConversation ||
      !typingUsers.has(currentConversation) ||
      !userId
    ) {
      return false;
    }
    return typingUsers.get(currentConversation).has(userId);
  },

  isUserOnline: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const { onlineUsers } = get();
    return onlineUsers.get(userId)?.lastSeen || null;
  },

  cleanup: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },

  fetchUserStatus: (userId) => {
    const { socket } = get();
    if (!socket || !userId) return;

    socket.emit('get_user_status', userId, (status) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(status.userId, {
          isOnline: status.isOnline,
          lastSeen: status.lastSeen,
        });
        return { onlineUsers: newOnlineUsers };
      });
    });
  },
}));
