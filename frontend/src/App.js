// import React, { useEffect } from 'react'
// import {BrowserRouter as Router , Routes, Route, BrowserRouter} from 'react-router-dom'
// import './App.css';
// import Login from './pages/user-login/Login';
// import {ToastContainer} from 'react-toastify'
// import 'react-toastify/dist/ReactToastify.css';
// import { ProtectedRoute, PublicRoute } from './Protected';
// import HomePage from './components/HomePage';
// import UserDetails from './components/UserDetails';
// import Status from './pages/statusSection/Status';
// import Setting from './pages/SettingSection/Setting';
// import useUserStore from './store/useUserStore';
// import { disconnectSocket, initializeSocket } from './services/chat.service';
// import { useChatStore } from './store/chatStore';
// import VideoCallManager from './pages/VideoCall/VideoCallManager';

// function App() {
//   const {user} = useUserStore();
//   const {setCurrentUser,initializeListners,cleanup} = useChatStore();

//   useEffect(() => {
//     if (user?._id) {
//       const socket = initializeSocket();

//       if (socket) {
//         setCurrentUser(user);
//         initializeListners();
//       }
//     }

//       return () => {
//         cleanup();
//         disconnectSocket();
//       };
    

    
//   }, [user, setCurrentUser, initializeListners, cleanup]);

//   // ,setCurrentUser,initializeListners,cleanup 

//   return (
//     <>
//     <ToastContainer position='top-right' autoClose={3000} />
//     <VideoCallManager/>
//     <Router>
//       <Routes>
//         <Route element={<PublicRoute/>}>
//           <Route path='/user-login' element={<Login/>} />
//         </Route>

//         <Route element={<ProtectedRoute/>}>
//           <Route path='/' element={<HomePage/>} />
//           <Route path='/user-profile' element={<UserDetails/>} />
//           <Route path='/status' element={<Status/>} />
//           <Route path='/setting' element={<Setting/>} />
//         </Route>
//       </Routes>
//     </Router>
//     </>
//   );
// }

// export default App;



import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Component & Page Imports
import Login from './pages/user-login/Login';
import HomePage from './components/HomePage';
import UserDetails from './components/UserDetails';
import Status from './pages/statusSection/Status';
import Setting from './pages/SettingSection/Setting';
import VideoCallManager from './pages/VideoCall/VideoCallManager';

// Store & Helper Imports
import useUserStore from './store/useUserStore';
import { useChatStore } from './store/chatStore';
import { ProtectedRoute, PublicRoute } from './Protected';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  // 1. Get the logged-in user from your user store
  const { user } = useUserStore();
  
  // 2. Get the connection actions from your chat store.
  //    NOTE: You will need to create these actions in `useChatStore.js` as we discussed.
  const { connectSocket, disconnect } = useChatStore();

  // 3. This is the corrected effect. It is stable and has a clear purpose.
  useEffect(() => {
    // If a user is logged in, tell the store to handle the connection
    if (user?._id) {
      connectSocket(user);
    }

    // This cleanup function runs when the component unmounts or the user logs out
    return () => {
      disconnect();
    };
  }, [user, connectSocket, disconnect]); // Stable dependencies

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      {/* VideoCallManager is always active, listening for incoming calls */}
      <VideoCallManager /> 
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;