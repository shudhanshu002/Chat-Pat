import React, { useRef, useState } from 'react';
import {
  FaCheck,
  FaCheckDouble,
  FaPlus,
  FaRegCopy,
  FaSmile,
  FaTrash,
} from 'react-icons/fa';
import { format } from 'date-fns';
import { HiDotsVertical } from 'react-icons/hi';
import useOutsideClick from '../../hooks/useOutsideClick';
import EmojiPicker from 'emoji-picker-react';
import { RxCross2 } from 'react-icons/rx';

const MessageBubble = ({
  message,
  theme,
  onReact,
  currentUser,
  deleteMessage,
  isConsecutive,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const optionRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const reactionMenuRef = useRef(null);

  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) setShowEmojiPicker(false);
  });
  useOutsideClick(reactionMenuRef, () => {
    if (showReactions) setShowReactions(false);
  });
  useOutsideClick(optionRef, () => {
    if (showOptions) setShowOptions(false);
  });

  if (!message || !message.sender) return null;

  const isUserMessage = message.sender._id === currentUser?._id;

  const bubbleContentClass = isUserMessage
    ? `rounded-lg p-3 min-w-[80px] max-w-sm md:max-w-md relative ${
        theme === 'dark' ? 'bg-[#005c4b] text-white' : 'bg-[#d9fdd3] text-black'
      }`
    : `rounded-lg p-3 min-w-[80px] max-w-sm md:max-w-md relative ${
        theme === 'dark' ? 'bg-[#202c33] text-white' : 'bg-white text-black'
      }`;

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowEmojiPicker(false);
    setShowReactions(false);
  };

  return (
    <>
      <style>
        {`
          .bubble-spike::after {
            content: '';
            position: absolute;
            top: 0;
            width: 0;
            height: 0;
            border-style: solid;
          }
          .sender-spike::after {
            border-width: 0 0 10px 10px;
            border-color: transparent transparent transparent ${
              theme === 'dark' ? '#005c4b' : '#d9fdd3'
            };
            right: -8px;
          }
          .receiver-spike::after {
            border-width: 0 10px 10px 0;
            border-color: transparent ${
              theme === 'dark' ? '#202c33' : 'white'
            } transparent transparent;
            left: -8px;
          }
        `}
      </style>

      <div
        className={`w-full flex ${
          isUserMessage ? 'justify-end' : 'justify-start'
        } ${isConsecutive ? 'mb-0.5' : 'mb-2'}`}
      >
        <div
          className={`${bubbleContentClass} group ${
            !isConsecutive
              ? isUserMessage
                ? 'sender-spike'
                : 'receiver-spike'
              : ''
          } ${!isConsecutive && 'bubble-spike'}`}
        >
          {/* Media */}
          {message.contentType === 'image' && (
            <div>
              <img
                src={message.imageOrVideoUrl}
                alt="image-content"
                className="rounded-lg max-w-xs mb-1"
              />
              <p className="mt-1">{message.content}</p>
            </div>
          )}
          {message.contentType === 'video' && (
            <div>
              <video
                src={message.imageOrVideoUrl}
                alt="image-video"
                controls
                className="rounded-lg max-w-xs mb-1"
              />
              <p className="mt-1">{message.content}</p>
            </div>
          )}

          {/* Text content */}
          <p className="break-words pr-12">{message.content}</p>

          {/* Time (bottom-right) */}
          <div className="absolute bottom-1 right-2 flex items-center gap-1 text-xs opacity-60">
            <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
            {isUserMessage && (
              <>
                {message.messageStatus === 'send' && <FaCheck size={12} />}
                {message.messageStatus === 'delivered' && (
                  <FaCheckDouble size={12} />
                )}
                {message.messageStatus === 'read' && (
                  <FaCheckDouble size={12} className="text-blue-500" />
                )}
              </>
            )}
          </div>

          {/* Three dots (top-right, above time) */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={() => setShowOptions((prev) => !prev)}
              className={`p-1 rounded-full ${
                theme === 'dark'
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <HiDotsVertical size={18} />
            </button>
          </div>

          {/* Reaction button (side) */}
          <div
            className={`absolute ${
              isUserMessage ? '-left-10' : '-right-10'
            } top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={`p-2 rounded-full ${
                theme === 'dark'
                  ? 'bg-[#202c33] hover:bg-opacity-80'
                  : 'bg-white hover:bg-gray-100'
              } shadow-lg`}
            >
              <FaSmile
                className={`${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}
              />
            </button>
          </div>

          {/* Quick reactions */}
          {showReactions && (
            <div
              ref={reactionMenuRef}
              className={`absolute -top-10 left-0 flex items-center ${
                theme === 'dark' ? 'bg-[#202c33]' : 'bg-white'
              } rounded-full px-2 py-1.5 gap-1 shadow-lg z-20`}
            >
              {quickReactions.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleReact(emoji)}
                  className="hover:scale-125 transition-transform p-1 text-lg"
                >
                  {emoji}
                </button>
              ))}
              <div
                className={`w-[1px] h-5 ${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                } mx-1`}
              />
              <button
                className={`${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                } rounded-full p-1`}
                onClick={() => {
                  setShowEmojiPicker(true);
                  setShowReactions(false);
                }}
              >
                <FaPlus
                  className={`h-4 w-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute -top-12 right-0 z-50">
              <div className="relative">
                <EmojiPicker
                  onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
                  theme={theme}
                />
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  <RxCross2 />
                </button>
              </div>
            </div>
          )}

          {/* Reaction display */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={`absolute -bottom-3 ${
                isUserMessage ? 'right-2' : 'left-2'
              } ${
                theme === 'dark' ? 'bg-[#2a3942]' : 'bg-gray-200'
              } rounded-full px-2 shadow-md text-xs`}
            >
              {message.reactions.map((reaction, index) => (
                <span key={index} className="mr-1">
                  {reaction.emoji}
                </span>
              ))}
              <span>{message.reactions.length}</span>
            </div>
          )}

          {/* Options menu */}
          {showOptions && (
            <div
              ref={optionRef}
              className={`absolute top-full mt-1 ${
                isUserMessage ? 'right-0' : 'left-0'
              } z-50 w-36 rounded-xl shadow-lg py-2 text-sm ${
                theme === 'dark'
                  ? 'bg-[#233138] text-white'
                  : 'bg-white text-black'
              }`}
            >
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  setShowOptions(false);
                }}
                className={`flex items-center w-full px-4 py-2 gap-3 ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <FaRegCopy size={14} />
                <span>Copy</span>
              </button>
              {isUserMessage && (
                <button
                  onClick={() => {
                    deleteMessage(message?._id);
                    setShowOptions(false);
                  }}
                  className={`flex items-center w-full px-4 py-2 gap-3 text-red-500 ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <FaTrash size={14} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageBubble;
