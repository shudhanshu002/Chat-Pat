import React, { useEffect, useRef, useState } from 'react';
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/useUserStore';
import { useChatStore } from '../../store/chatStore';
import { isToday, isYesterday, format } from 'date-fns';
import whatsappImage from '../../images/whatsapp_img.png';
import {
  FaArrowLeft,
  FaEllipsisV,
  FaFile,
  FaImage,
  FaLock,
  FaPaperclip,
  FaPaperPlane,
  FaSmile,
  FaTimes,
  FaVideo,
} from 'react-icons/fa';
import MessageBubble from './MessageBubble';
import EmojiPicker from 'emoji-picker-react';
import VideoCallModal from '../VideoCall/VideoCallModal';
import { getSocket } from '../../services/chat.service';
import useVideoCallStore from '../../store/VideoCallStore';


const isValidate = (date) => {
  return date instanceof Date && !isNaN(date);
};



const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const socket = getSocket();
  const { initiateCall } = useVideoCallStore();

  const {
    messages,
    sendMessage,
    fetchMessages,
    isUserTyping,
    isUserOnline,
    startTyping,
    stopTyping,
    getUserLastSeen,
    addReaction,
    deleteMessage,
    fetchUserStatus,
    currentConversation,
  } = useChatStore();

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = selectedContact
    ? getUserLastSeen(selectedContact._id)
    : null;
  const isTyping = selectedContact ? isUserTyping(selectedContact._id) : false;

  useEffect(() => {
    if (selectedContact?.conversation?._id) {
      fetchMessages(selectedContact.conversation._id).then(() => {
        useChatStore.getState().markMessagesAsRead();
      });
    } else {
      useChatStore.setState({ messages: [] });
    }

    if (selectedContact?._id) {
      fetchUserStatus(selectedContact._id);
    }
  }, [selectedContact, fetchMessages, fetchUserStatus]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact?._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedContact?._id);
      }, 2000);
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [message, selectedContact, startTyping, stopTyping]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setFilePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedContact || (!message.trim() && !selectedFile)) return;

    try {
      const formData = new FormData();
      formData.append('senderId', user?._id);
      formData.append('receiverId', selectedContact?._id);
      const status = online ? 'delivered' : 'send';
      formData.append('messageStatus', status);
      if (message.trim()) {
        formData.append('content', message.trim());
      }
      if (selectedFile) {
        formData.append('media', selectedFile, selectedFile.name);
      }

      await sendMessage(formData);

      setMessage('');
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(false);
    } catch (error) {
      console.log('Failed to send message', error);
    }
  };

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) return null;
    let dateString;
    if (isToday(date)) {
      dateString = 'Today';
    } else if (isYesterday(date)) {
      dateString = 'Yesterday';
    } else {
      dateString = format(date, 'EEEE, MMMM d');
    }
    return (
      <div className="flex justify-center my-4">
        <span
          className={`px-4 py-2 rounded-full text-sm ${
            theme === 'dark'
              ? 'bg-gray-700 text-gray-400'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {dateString}
        </span>
      </div>
    );
  };

  const groupMessages = Array.isArray(messages)
    ? messages.reduce((acc, message) => {
        if (!message.createdAt) return acc;
        const date = new Date(message.createdAt);
        if (isValidate(date)) {
          const dateString = format(date, 'yyyy-MM-dd');
          if (!acc[dateString]) {
            acc[dateString] = [];
          }
          acc[dateString].push(message);
        }
        return acc;
      }, {})
    : {};

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
  };

  const handleVideoCall = () => {
    if (selectedContact && online) {

        initiateCall(
          selectedContact?._id,
          selectedContact?.username,
          selectedContact?.profilePicture,
          "video"
        )   
    } else {
      alert('user is offline--chatWWWW, cannot initiate call');
    }
  };

  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center mx-auto h-screen text-center">
        <div className="max-w-md">
          <img
            src={whatsappImage}
            alt="chat-pat"
            className="w-full h-auto scale-150"
          />
          <h2
            className={`text-3xl font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}
          >
            Select a conversation to start chatting
          </h2>
          <p
            className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            } mb-6`}
          >
            Choose a contact from the list on the left to view messages
          </p>
          <p
            className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            } text-sm mt-8 flex items-center justify-center gap-2`}
          >
            <FaLock className="h-4 w-4" />
            Your personal messages are end-to-end encrypted
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 h-screen w-full flex flex-col">
        <div
          className={`p-4 ${
            theme === 'dark' ? 'bg-[#202c33]' : 'bg-gray-100'
          } flex items-center shadow-md`}
        >
          <button
            className="mr-2 focus:outline-none"
            onClick={() => setSelectedContact(null)}
          >
            <FaArrowLeft className="h-6 w-6" />
          </button>
          <img
            src={selectedContact?.profilePicture}
            alt={selectedContact?.username}
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-3 flex-grow">
            <h2 className="font-semibold text-start">
              {selectedContact.username}
            </h2>
            {isTyping ? (
              <div className="text-sm text-blue-500"> Typing...</div>
            ) : (
              <p
                className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {online
                  ? 'Online'
                  : lastSeen
                  ? `Last seen ${format(new Date(lastSeen), 'HH:mm')}`
                  : 'Offline'}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button  
              className="focus:outline-none"
              onClick={handleVideoCall}
              title={online ? 'Start video call ' : 'user is offline'}
            >
              <FaVideo className="h-5 w-5 text-blue-500 hover:text-green-600" />
            </button>
            <button className="focus:outline-none">
              <FaEllipsisV className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div
          className={`flex-1 p-4 overflow-y-auto ${
            theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#E5DDD5]'
          }`}
        >
          {Object.entries(groupMessages).map(([date, msgs]) => (
            <React.Fragment key={date}>
              {renderDateSeparator(new Date(date))}
              {msgs.map((msg, index, array) => {
                const prevMessage = array[index - 1];
                const isConsecutive = prevMessage
                  ? prevMessage.sender._id === msg.sender._id
                  : false;

                return (
                  <MessageBubble
                    key={msg._id || msg.tempId}
                    message={msg}
                    theme={theme}
                    currentUser={user}
                    onReact={handleReaction}
                    deleteMessage={deleteMessage}
                    isConsecutive={isConsecutive}
                  />
                );
              })}
            </React.Fragment>
          ))}
          <div ref={messageEndRef} />
        </div>
        {filePreview && (
          <div className="relative p-2 bg-gray-800">
            {selectedFile?.type.startsWith('video/') ? (
              <video
                src={filePreview}
                controls
                className="w-80 object-cover rounded shadow-lg mx-auto"
              />
            ) : (
              <img
                src={filePreview}
                alt="file-preview"
                className="w-80 object-cover rounded shadow-lg mx-auto"
              />
            )}

            <button
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
              }}
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        )}
        <div
          className={`p-4 ${
            theme === 'dark' ? 'bg-[#202c33]' : 'bg-gray-100'
          } flex items-center space-x-2 relative`}
        >
          <button
            className="focus:outline-none"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <FaSmile
              className={`h-6 w-6 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}
            />
          </button>
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute left-0 bottom-16 z-50"
            >
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  setMessage((prev) => prev + emojiObject.emoji);
                  setShowEmojiPicker(false);
                }}
                theme={theme}
              />
            </div>
          )}
          <div className="relative">
            <button
              className="focus:outline-none"
              onClick={() => setShowFileMenu(!showFileMenu)}
            >
              <FaPaperclip
                className={`h-6 w-6 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                } mt-2`}
              />
            </button>
            {showFileMenu && (
              <div
                className={`absolute bottom-full left-0 mb-2 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                } rounded-lg shadow-lg`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className={`flex items-center px-4 py-2 w-full transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                  }`}
                >
                  <FaImage className="mr-2" />
                  Image/Video
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className={`flex items-center px-4 py-2 w-full transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                  }`}
                >
                  <FaFile className="mr-2" />
                  Documents
                </button>
              </div>
            )}
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type a message"
            className={`flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 ${
              theme === 'dark'
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-white text-black border-gray-300'
            }`}
          />
          <button onClick={handleSendMessage} className="focus:outline-none">
            <FaPaperPlane className="h-6 w-6 text-green-500" />
          </button>
        </div>
      </div>


    </>
  );
};

export default ChatWindow;
