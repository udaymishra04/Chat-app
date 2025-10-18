// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { setOnlineUser } from "../features/auth/authSlice";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const useSocket = (userId) => {
  const socketRef = useRef(null); // keeps socket instance
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId) return; // no user -> no socket

    // Create socket connection
    socketRef.current = io(backendUrl, { query: { userId } });

    // Listen for online users
    socketRef.current.on("getOnlineUsers", (userIds) => {
      dispatch(setOnlineUser(userIds));
    });

    // Cleanup: disconnect on unmount
    return () => {
      socketRef.current.disconnect();
    };
  }, [userId]);

  return socketRef.current;
};
