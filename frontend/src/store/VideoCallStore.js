import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useChatStore } from './chatStore';
import useUserStore from './useUserStore';
import { getSocket } from '../services/chat.service';

const useVideoCallStore = create(
  subscribeWithSelector((set, get) => ({
    //call state
    currentCall: null,
    incomingCall: null,
    isCallActive: false,
    callType: null, // video or audio

    //media state
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,

    // webRTc
    peerConnection: null,
    iceCandidateQueue: [], //Queue for ICE candiadte

    isCallModalOpen: false,
    callStatus: 'idle', // idle, calling, ringging connectiong, connected

    //Actions
    setCurrentCall: (call) => {
      set({ currentCall: call });
    },

    setIncomingCall: (call) => {
      set({ incomingCall: call });
    },

    setCallActive: (active) => {
      set({ isCallActive: active });
    },

    setCallType: (type) => set({ callType: type }),

    setLocalStream: (stream) => {
      const { localStream } = get();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      set({ localStream: stream });
    },

    setRemoteStream: (stream) => {
      set({ remoteStream: stream });
    },

    setPeerConnection: (pc) => {
      set({ peerConnection: pc });
    },

    setCallModalOpen: (open) => {
      set({ isCallModalOpen: open });
    },

    setCallStatus: (status) => {
      set({ callStatus: status });
    },

    addIceCandidate: (candidate) => {
      const { iceCandidateQueue } = get();
      set({ iceCandidateQueue: [...iceCandidateQueue, candidate] });
    },

    processQueueIceCandidates: async () => {
      const { peerConnection, iceCandidateQueue } = get();

      if (
        peerConnection &&
        peerConnection.remoteDescription &&
        iceCandidateQueue.length > 0
      ) {
        for (const candidate of iceCandidateQueue) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          } catch (error) {
            console.error(`ICE candidate error ${error}`);
          }
        }
        set({ iceCandidateQueue: [] });
      }
    },

    toggleVideo: () => {
      const { localStream, isVideoEnabled } = get();
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !isVideoEnabled;
          set({ isVideoEnabled: !isVideoEnabled });
        }
      }
    },

    toggleAudio: () => {
      const { localStream, isAudioEnabled } = get();
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !isAudioEnabled;
          set({ isAudioEnabled: !isAudioEnabled });
        }
      }
    },

    endCall: () => {
      const { localStream, peerConnection } = get();

      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      if (peerConnection) {
        peerConnection.close();
      }

      set({
        currentCall: null,
        incomingCall: null,
        isCallActive: false,
        callType: null,
        localStream: null,
        remoteStream: null,
        isVideoEnabled: true,
        isAudioEnabled: true,
        peerConnection: null,
        iceCandidateQueue: [],
        isCallModalOpen: false,
        callStatus: 'idle',
      });
    },
    clearIncomingCall: () => {
      set({ incomingCall: null });
    },
    initiateCall: (
      receiverId,
      receiverName,
      receiverAvatar,
      callType = 'video',
    ) => {
      const { setCurrentCall, setCallType, setCallModalOpen, setCallStatus } = get();
    //   const { socket } = useChatStore.getState(); // ✅ grab socket from chatStore
      const { user } = useUserStore.getState(); // ✅ grab user from userStore
      const { socket } = useChatStore.getState();

      console.log('--- Debugging initiateCall ---');
      console.log('Socket object:', socket);
      console.log('User object:', user);

      if (!user ) {
        alert('user not ready yet. Please wait.');
        return;
      }

      if (!socket || !user?._id) {
        console.error('Cannot initiate call: socket or user missing');
        return;
      }

      const callId = `${user._id}-${receiverId}-${Date.now()}`;

      // update store state
      setCurrentCall({
        callId,
        participantId: receiverId,
        participantName: receiverName,
        participantAvatar: receiverAvatar,
      });
      setCallType(callType);
      setCallModalOpen(true);
      setCallStatus('calling');

      // emit socket event
      socket.emit('initiate_call', {
        // callId,
        callerId: user._id,
        receiverId,
        callType,
        callerInfo: {
          username: user.username,
          profilePicture: user.profilePicture,
        },
      });
    },
  })),
);

export default useVideoCallStore;
