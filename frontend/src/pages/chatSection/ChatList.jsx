import { useState } from 'react';
import useLayoutStore from '../../store/layoutStore';
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/useUserStore';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';
import formatTimestamp from '../../utils/formatTime';
import { useChatStore } from '../../store/chatStore';

const ChatList = ({ contacts }) => {
  const setSelectedContact = useLayoutStore(
    (state) => state.setSelectedContact,
  );
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [searchTerms, setSearchTerms] = useState('');
  //   const {lastMessages} = useChatStore()
  const lastMessages = useChatStore((state) => state.lastMessages);

  const filteredContacts = contacts?.filter((contact) =>
    contact?.username?.toLowerCase().includes(searchTerms.toLowerCase()),
  );

  const getUnreadCount = (conversation) => {
    if (!conversation) return 0;
    const lastMsg = getLastMessage(conversation);
    if (!lastMsg) return 0;
    return lastMsg?.receiver?._id === user?._id
      ? conversation.unreadCount || 0
      : 0;
  };

  const getLastMessage = (conversation) => {
    if (!conversation || !conversation._id) return null;
    return lastMessages[conversation._id] || conversation.lastMessage || null;
  };

  return (
    <div
      className={`w-full border-r h-screen ${
        theme === 'dark'
          ? 'bg-[rgb(17,27,33)] border-gray-600'
          : 'bg-white border-gray-200'
      }`}
    >
      <div
        className={`p-4 flex justify-center ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}
      >
        <h2 className="text-xl font-semibold">Chats</h2>
        <button className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
          <FaPlus />
        </button>
      </div>

      <div className="p-2">
        <div className="relative">
          <FaSearch
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-800'
            }`}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              theme === 'dark'
                ? 'bg-gray-800 text-white border-gray-700 placeholder-gray-500'
                : 'bg-gray-100 text-black border-gray-200 placeholder-gray-400'
            } outline-none`}
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-120px)]">
        {filteredContacts.map((contact) => {
          const lastMessage = contact?.conversation?._id
            ? getLastMessage(contact.conversation)
            : null;

          return (
            <motion.div
              key={contact?._id}
              onClick={() => setSelectedContact(contact)}
              className={`p-3 flex items-center cursor-pointer ${
                theme === 'dark'
                  ? selectedContact?._id === contact?._id
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-800'
                  : selectedContact?._id === contact?._id
                  ? 'bg-gray-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <img
                src={contact?.profilePicture}
                alt={contact?.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-baseline">
                  <h2
                    className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}
                  >
                    {contact?.username}
                  </h2>
                  {lastMessage && (
                    <span
                      className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      } `}
                    >
                      {formatTimestamp(lastMessage?.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline">
                  <p
                    className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    } truncate`}
                  >
                    {lastMessage?.content || '__'}
                  </p>

                  {getUnreadCount(contact.conversation) > 0 && (
                    <p
                      className={`text-sm font-semibold w-6 h-6 flex items-center justify-center bg-yellow-500 ${
                        theme === 'dark' ? 'text-gray-800' : 'text-white'
                      } rounded-full`}
                    >
                      {getUnreadCount(contact.conversation)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
