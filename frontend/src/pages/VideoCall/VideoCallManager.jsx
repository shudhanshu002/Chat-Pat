import React, { useCallback, useEffect } from 'react'
import useVideoCallStore from '../../store/VideoCallStore'
import useUserStore from "../../store/useUserStore"
import VideoCallModal from './VideoCallModal';
import { useChatStore } from '../../store/chatStore';

const VideoCallManager = () => {

  const {socket} = useChatStore();

    const {
        setIncomingCall,
        setCurrentCall,
        setCallType,
        setCallModalOpen,
        endCall,
        setCallStatus
    } = useVideoCallStore();

    const {user} = useUserStore();

    useEffect(()=> {
        if(!socket) return;
            console.log(
              `[Receiver] ✅ VideoCallManager is LISTENING for calls on socket ID: ${socket.id}`,
            );
        console.log(
          `[VideoCallManager] ✅ Connection stable. Listening for calls on socket ID: ${socket.id}`,
        );

        //Handle incoming call
        const handleIncomingCall = ({callerId, callerName, callerAvatar , callType, callId}) => {
            setIncomingCall({
                callerId,
                callerName,
                callerAvatar,
                callId
            })

            setCallType(callType)
            setCallModalOpen(true)
            setCallStatus("ringing")
        }

        const handleCallEnded = ({reason}) => {
            setCallStatus("failed")
            setTimeout(()=> {
                endCall();
            },2000)
        }

        socket.on("incoming_call",handleIncomingCall)
        socket.on("call_failed",handleCallEnded)

        return () => {
            socket.off("incoming_call",handleIncomingCall)
            socket.off("call_failed",handleCallEnded)
        }
    },[socket,setIncomingCall,setCallType,setCallModalOpen,setCallStatus,endCall])



// // memoized funtion
//     const initiateCall = useCallback ((
//       receiverId,
//       receiverName,
//       receiverAvatar,
//       callType = 'video',
//     )=> {
//       const callId = `${user?._id}-${receiverId}-${Date.now()}`;

//       const callData = {
//         callId,
//         participantId: receiverId,
//         participantName: receiverName,
//         participantAvatar: receiverAvatar
//       }

//       setCurrentCall(callData)
//       setCallType(callType);
//       setCallModalOpen(true);
//       setCallStatus('calling');

//       // emit socket event
//       socket.emit('initiate_call', {
//         callerId: user?._id,
//         receiverId,
//         callType,
//         callerInfo: {
//           username: user.username,
//           profilePicture: user.profilePicture,
//         },
//       });
//     },[
//       user,socket,setCurrentCall,setCallType,setCallModalOpen,setCallStatus
//   ])


  // useEffect(()=> {
  //   useVideoCallStore.getState().initiateCall = initiateCall
  // },[initiateCall])



// useEffect(() => {
//   if (!socket) {
//     console.log('[VideoCallManager] 🔴 FAILED: Socket object is not available.');
//     return;
//   }

//   // THIS IS THE MOST IMPORTANT LOG
//   console.log(`[VideoCallManager] ✅ LISTENING for calls on socket.id: ${socket.id}`);

//   const handleIncomingCall = (data) => {
//     console.log('✅✅✅ [VideoCallManager] SUCCESS: RECEIVED INCOMING_CALL EVENT!', data);
    
//     const { callerId, callerName, callerAvatar, callType, callId } = data;
//     setIncomingCall({ callerId, callerName, callerAvatar, callId });
//     setCallType(callType);
//     setCallModalOpen(true);
//     setCallStatus('ringing');
//   };

//   socket.on('incoming_call', handleIncomingCall);

//   return () => {
//     console.log(`[VideoCallManager] Unmounting listener from socket.id: ${socket.id}`);
//     socket.off('incoming_call', handleIncomingCall);
//   };
// }, [socket, setIncomingCall, setCallType, setCallModalOpen, setCallStatus, endCall]);

  return <VideoCallModal socket={socket} />
}

export default VideoCallManager
