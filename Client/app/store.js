import {configureStore} from '@reduxjs/toolkit'
import chatReducer from '../src/features/chat/chatSlice'
import authReducer from '../src/features/auth/authSlice'

export default configureStore({
  reducer: {
    chat: chatReducer,
    auth: authReducer,
  },
})