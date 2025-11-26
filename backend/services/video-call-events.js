const handleVideoCallEvent = (socket, io, onlineUsers) => {
  //Initiate video call

  socket.on(
    'initiate_call',
    ({ callerId, receiverId, callType, callerInfo }) => {

      console.log('--- Video Call Initiation ---');
      console.log(
        `[Server] Caller (${callerId}) is trying to call Receiver (${receiverId}).`,
      );
      console.log('[Server] Current Online Users Map:', onlineUsers);


      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        const callId = `${callerId}-${receiverId}-${Date.now()}`;
        console.log(
          `[Server] SUCCESS: Found receiver. Sending 'incoming_call' to socket ID: ${receiverSocketId}`,
        );
        

        io.to(receiverSocketId).emit('incoming_call', {
          callerId,
          callerName: callerInfo.username,
          callerAvatar: callerInfo.profilePicture,
          callId,
          callType,
        });
      } else {
        console.log(`server: Receiver ${receiverId} is offline`);
        socket.emit('call_failed', { reason: 'user is offline' });
      }
    },
  );

  //Accept call
  socket.on('accept_call', ({ callerId, callId, receiverInfo }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      io.to(callerSocketId).emit('call_accepted', {
        callerName: receiverInfo.username,
        callerAvatar: receiverInfo.profilePicture,
        callId,
      });
    } else {
      console.log(`server: Caller ${callerId} is offline`);
    }
  });

  //Reject call
  socket.on('reject_call', ({ callerId, callId }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      io.to(callerSocketId).emit('call_rejected', { callId });
    }
  });

  //end call
  socket.on('end_call', ({ callId, participantId }) => {
    const participantSocketId = onlineUsers.get(participantId);
    if (participantSocketId) {
      io.to(participantSocketId).emit('call_ended', { callId });
    }
  });


  //webRct signaling event with proper userId
  socket.on("webrtc_offer", ({offer, receiverId, callId}) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if(receiverSocketId) {
        io.to(receiverSocketId).emit("webrtc_offer", {
            offer,
            senderId: socket.userId,
            callId
        })
        console.log(`server offer forwarded to ${receiverId}`);
    }else {
        console.log(`server: Receiver ${receiverId} not found the offer`)
    }
  })

  //answer signal
  socket.on('webrtc_answer', ({ answer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('webrtc_answer', {
        answer,
        senderId: socket.userId,
        callId,
      });
      console.log(`server answer forwarded to ${receiverId}`);
    } else {     
      console.log(`server: Receiver ${receiverId} not found the offer`);
    }
  });


  socket.on('webrtc_ice_candidate', ({ candidate, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('webrtc_ice_candidate', {
        candidate,
        senderId: socket.userId,
        callId,
      });
    } else {
      console.log(`server: Receiver ${receiverId} not found the ICE condidate`);
    }
  });
};


module.exports = handleVideoCallEvent;