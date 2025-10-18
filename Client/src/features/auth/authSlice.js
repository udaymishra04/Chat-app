// src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

// Set backend base URL
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

// Initialize token from localStorage
const initialToken = localStorage.getItem("token");


// Initial state
const initialState = {
  token: initialToken,
  authuser: null,
  onlineUser: [],
  // socket: null,
};

export const logout = createAsyncThunk(
  "auth/logout",
  async (state, { getState, dispatch }) => {
    const { socket } = getState().auth;

    // Clear localStorage
    localStorage.removeItem("token");
    // console.log(state)
    // state.token = null;
    // state.authuser = null;
    // state.onlineUser = []

    // Clear Axios Authorization header
    delete axios.defaults.headers.common["Authorization"];

    toast.success("User logged out successfully!");
    // Disconnect socket if exists
    // if (socket) socket.disconnect();

    // Show toast

    // Return payload (optional, can be empty)
    return {};
  }
);

// Async thunk: check if user is authenticated
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        dispatch(connectSocket(data.user));
        return data.user;
      }
      return null;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return rejectWithValue(null);
    }
  }
);

// Async thunk: login user
export const login = createAsyncThunk(
  "auth/login",
  async ({ state, credentials }, { rejectWithValue, dispatch }) => {
    try {
      // console.log(credentials)
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      // console.log(data)
      if (data.success) {
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        // dispatch(connectSocket(data.userData));
        toast.success(data.message);
        return { user: data.userData, token: data.token };
      } else {
        toast.error("Login failed");
        return rejectWithValue(null);
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message);
      return rejectWithValue(null);
    }
  }
);

// Async thunk: update profile
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (body, { rejectWithValue }) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        toast.success("Profile updated successfully!");
        return data.user;
      }
      return rejectWithValue(null);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return rejectWithValue(null);
    }
  }
);

// Connect to socket
// export const connectSocket = createAsyncThunk(
//   "auth/connectSocket",
//   async (userData, { getState, dispatch }) => {
//     const { socket } = getState().auth;
//     if (!userData || socket?.connected) return;

//     const newSocket = io(backendUrl, { query: { userId: userData._id } });
//     newSocket.connect();

//     // Listen to online users
//     newSocket.on("getOnlineUsers", (userIds) => {
//       dispatch(setOnlineUser(userIds));
//     });

//     return newSocket;
//   }
// );

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {    
    setOnlineUser: (state, action) => {
      state.onlineUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.authuser = action.payload;
      })
      .addCase(login.fulfilled, (state, action) => {
        if (action.payload) {
          state.authuser = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.authuser = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        // ✅ reset state here
        console.log(state)
        state.token = null;
        state.authuser = null;
        state.onlineUser = [];
        state.socket = null;
        console.log(state)
      });
      // .addCase(connectSocket.fulfilled, (state, action) => {
      //   state.socket = action.payload;
      // });
  },
});

export const { setOnlineUser } = authSlice.actions;
export default authSlice.reducer;
