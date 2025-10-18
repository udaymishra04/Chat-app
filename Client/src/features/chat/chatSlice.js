import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import axios from "axios";

/**
 * Redux version of ChatContext
 * This slice manages:
 * - messages
 * - users (for sidebar)
 * - selectedUser
 * - unseenMessages
 * 
 * ⚙️ Functionality:
 * Replaces Context API logic using Redux actions, reducers, and thunks.
 */
// Set backend base URL
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

// ✅ Thunk to fetch all users for sidebar
export const getUsers = createAsyncThunk(
  "chat/getUsers",
  async (_, { getState, rejectWithValue }) => {
    try {
      // const axios = getState().auth.axios; // 🔗 Access axios instance from authSlice
      const { data } = await axios.get("/api/messages/users");

      if (data.success) {
        return {
          users: data.users,
          unseenMessages: data.unseenMessages || {},
        };
      }
      return rejectWithValue(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      return rejectWithValue(error.message);
    }
  }
);

// ✅ Thunk to fetch chat messages for selected user
export const getMessages = createAsyncThunk(
  "chat/getMessages",
  async (userId, { getState, rejectWithValue }) => {
    try {
      // const axios = getState().auth.axios;
      const { data } = await axios.get(`/api/messages/${userId}`);

      if (data.success) {
        return data.message; // using `data.message` (as per your API)
      }
      return rejectWithValue(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      return rejectWithValue(error.message);
    }
  }
);

// ✅ Thunk to send a message
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (messageData, { getState, rejectWithValue }) => {
    try {
      const { chat } = getState();
      // const axios = auth.axios;

      const payload = {
        ...messageData,
        receiverId: chat.selectedUser._id.trim(),
      };

      const { data } = await axios.post("/api/messages/send", payload);

      if (data.success) {
        return data.newMessage;
      }
      toast.error(data.message);
      return rejectWithValue(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      return rejectWithValue(error.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    users: [],
    selectedUser: null,
    unseenMessages: {},
  },
  reducers: {
    // ✅ Select a user to chat with
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },

    // ✅ Set unseen messages count manually
    setUnseenMessages: (state, action) => {
      state.unseenMessages = action.payload;
    },

    // ✅ Handle incoming socket message (real-time)
    handleSocketMessage: (state, action) => {
      const newMessage = action.payload;
      const senderId = newMessage.senderId?._id || newMessage.senderId;

      // If message is from current selected chat
      if (state.selectedUser && senderId === state.selectedUser._id) {
        newMessage.seen = true;
        state.messages = [...state.messages, newMessage];
      } else {
        state.unseenMessages[senderId] = (state.unseenMessages[senderId] || 0) + 1;
      }
    },

    // ✅ Clear chat messages (on logout or switch)
    clearChatState: (state) => {
      state.messages = [];
      state.selectedUser = null;
      state.unseenMessages = {};
      state.users = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // getUsers
      .addCase(getUsers.fulfilled, (state, action) => {
        state.users = action.payload.users;
        state.unseenMessages = action.payload.unseenMessages;
      })

      // getMessages
      .addCase(getMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
      })

      // sendMessage
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages = [...state.messages, action.payload];
      });
  },
});

export const {
  setSelectedUser,
  setUnseenMessages,
  handleSocketMessage,
  clearChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
