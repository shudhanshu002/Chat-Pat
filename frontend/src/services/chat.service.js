import {io} from "socket.io-client";
import useUserStore from "../store/useUserStore"

let socket = null;
const token = localStorage.getItem("auth_token");

export const initializeSocket = () => {
    console.log("Attempting to connect to backend at:", process.env.REACT_APP_API_URL); 
    if(socket) return socket;

    const user = useUserStore.getState().user;

    if(!user?._id){
        console.warn("No user found, cannot initialize socket yet.");
        return socket;
    }

    const BACKEND_URL = process.env.REACT_APP_API_URL;

    socket = io (BACKEND_URL, {
        auth: {token},
        // withCredentials: true, //--> to be commented
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });


    // connection eventy
    socket.on("connect", () => {
        if(!user?._id){
            console.warn("Cannot connect socket: user._id missing");
            return;
        }
        console.log("socket connected", socket.id);
        socket.emit("user_connected", user._id);
    })

    socket.on("connect_error", (error) => {
        console.error("socket connectiopn error",error);
    })

    //disconnected event 
    socket.on("disconnect", (response) => {
        console.log("socket disconnected",response);
    })

    return socket;
}

export const getSocket = ()=> {
    if(!socket) {
        return initializeSocket();
    }
    return socket;
}

export const disconnectSocket = () => {
    if(socket) {
        socket.disconnect();
        socket = null;
    }
}