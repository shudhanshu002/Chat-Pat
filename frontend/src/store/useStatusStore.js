import { create } from 'zustand';
import { getSocket } from '../services/chat.service';
import axiosInstance from '../services/url.service';
import useUserStore from './useUserStore';

const useStatusStore = create((set, get) => ({
  statuses: [],
  loading: false,
  error: null,

  //Active
  setStatuses: (statuses) => set({ statuses }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  //Initilize the socket listners
  initializeSocket: () => {
    const socket = getSocket();
    if (!socket) return;

    //Real time status events
    socket.on('new_status', (newStatus) => {
      set((state) => ({
        statuses: state.statuses.some((s) => s._id === newStatus._id)
          ? state.statuses
          : [newStatus, ...state.statuses],
      }));
    });

    socket.on('status_deleted', (statusId) => {
      set((state) => ({
        statuses: state.statuses.filter((s) => s._id !== statusId),
      }));
    });


    socket.on('status_viewed', (data) => {
      const { statusId, viewers } = data; 
      set((state) => ({
        statuses: state.statuses.map(
          (status) =>
            status._id === statusId ? { ...status, viewers: viewers } : status, // Use the received viewers array
        ),
      }));
    });
  },

  cleanupSocket: () => {
    const socket = getSocket();
    if (socket) {
      socket.off('new_status');
      socket.off('status_deleted');
      socket.off('status_viewed');
    }
  },

  // fetch status
  fetchStatuses: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get('/status');
      // set({statuses: data.data || [], loading: false })
      set({
        statuses: Array.isArray(data.data) ? data.data : [],
      });
    } catch (error) {
      console.error('Error fetchuinig status');
      // set({error: error.message , loading: false})
      set({
        error: error.response?.data?.message || error.message,
      });
    } finally {
      // always stop spinner even if error
      set({ loading: false });
    }
  },

  // crerate status
  createStatus: async (statusData) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      // if(statusData.file) {
      //     formData.append("media", statusData.file)
      // }
      if (statusData.file) {
        formData.append('file', statusData.file);
      }

      if (statusData.content?.trim()) {
        formData.append('content', statusData.content);
      }

      const { data } = await axiosInstance.post('/status', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      //add to status in localState
      if (data.data) {
        set((state) => ({
          statuses: state.statuses.some((s) => s._id === data.data._id)
            ? state.statuses
            : [data.data, ...state.statuses],
        }));
      }
      set({ loading: false });
      return data.data;
    } catch (error) {
      console.error('Error creatiung status', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  viewStatus: async (statusId) => {
    // --- ADD THESE DEBUG LOGS ---
    console.log('--- Viewing Status (Frontend) ---');
    console.log('1. viewStatus action in store was called.');
    console.log('2. The statusId received is:', statusId);

    // Check if the ID is valid before making the API call
    if (!statusId) {
      console.error(
        '🔴 FAILED: Attempted to view status with a null or undefined ID.',
      );
      return; // Stop here if the ID is invalid
    }

    try {
      set({ loading: true, error: null });

      console.log('3. Sending PUT request to the backend...');
      await axiosInstance.put(`status/${statusId}/view`);
      console.log('4. Backend request successful.');

      // Your optimistic update logic can go here later
      // For now, let's just confirm the API call works.

      set({ loading: false });
    } catch (error) {
      console.error('🔴 FAILED: The API call to view status failed.', error);
      set({ error: error.message, loading: false });
    }
  },

  deleteStatus: async (statusId) => {
    try {
      set({ loading: true, error: null });
      await axiosInstance.delete(`/status/${statusId}`);
      set((state) => ({
        statuses: state.statuses.filter((s) => s._id !== statusId),
      }));
      set({ loading: false });
    } catch (error) {
      console.error('Error deleting status', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getStatusViewers: async (statusId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axiosInstance.get(`/status/${statusId}/viewers`);
      set({ loading: false });
      return data.data;
    } catch (error) {
      console.error('Error getting status viewers', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // helper funtion for group status
  getGroupStatus: () => {
    const { statuses } = get();
    return statuses.reduce((acc, status) => {
      const statusUserId = status.user?._id;
      if (!acc[statusUserId]) {
        acc[statusUserId] = {
          id: statusUserId,
          name: status?.user?.username,
          avatar: status?.user?.profilePicture,
          statuses: [],
        };
      }

      acc[statusUserId].statuses.push({
        id: status._id,
        media: status.content,
        contentType: status.contentType,
        timestamp: status.createdAt,
        viewers: status.viewers,
      });
      return acc;
    }, {});
  },

  getUserStatuses: (userId) => {
    const groupedStatus = get().getGroupStatus();
    return userId ? groupedStatus[userId] : null;
  },

  getOtherStatuses: (userId) => {
    const groupedStatus = get().getGroupStatus();
    return Object.values(groupedStatus).filter(
      (contact) => contact.id !== userId,
    );
  },

  clearError: () => set({ error: null }),

  reset: () => {
    set({
      statuses: [],
      loading: false,
      error: null,
    });
  },
}));

export default useStatusStore;
