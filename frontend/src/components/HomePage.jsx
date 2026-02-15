import React, { useEffect, useState } from 'react'
import Layout from './Layout'
import { motion } from 'framer-motion';
import ChatList from '../pages/chatSection/ChatList';
import { getAllUsers } from '../services/user.services';
import { useChatStore } from '../store/chatStore';
import useUserStore from '../store/useUserStore';



const HomePage = () => {

    const [allUsers, setAllUsers] = useState([]);
    const { conversations, fetchConversations, currentUser } = useChatStore();

    const getUser = async() => {
        try {
            const result = await getAllUsers();
            if(result.status === 'success') {
                setAllUsers(result.data);
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
      if (currentUser) {
        fetchConversations();
      }
    }, [currentUser]);

    useEffect(() => {
      getUser();
    }, []);
    console.log("all users:- ",allUsers)

    const mergedContacts = allUsers
      .map((user) => {
        // Skip self
        if (user._id === currentUser?._id) return null;

        // Find conversation involving this user
        const conversation = conversations?.data?.find((conv) =>
          conv.participants.some((p) => p._id === user._id),
        );

        return {
          ...user,
          conversation: conversation || null,
          unreadCount: conversation?.unreadCount || 0,
          lastMessage: conversation?.lastMessage || null,
        };
      })
      .filter(Boolean);

  return (
    <Layout>
        <motion.div
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{duration:0.5}}
        className='h-full'
        >
            <ChatList contacts={mergedContacts} />
        </motion.div>
    </Layout>
  )
}

export default HomePage
