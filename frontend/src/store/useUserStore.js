import {create} from "zustand";
import {persist} from "zustand/middleware"
import axiosInstance from "../services/url.service";

const useUserStore= create(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading:true,
            setUser: (userData) => set({user: userData, isAuthenticated:true}),
            clearUser: () => set({user:null, isAuthenticated:false}),

            checkAuth: async() => {
                set({isLoading: true});
                try {
                    const response = await axiosInstance.get('/auth/check-auth');
                    if (response.data && response.data.data) {
                        set({ user: response.data.data, isAuthenticated: true, isLoading: false });
                    } else {
                        throw new Error("Invalid auth response");
                    }
                } catch (error) {
                    console.log("Authentication check failed, clearing user.");
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            }
        }),
        {
            name: "user-storage",
            getStorage: () => localStorage
        }
    )
);

export default useUserStore;