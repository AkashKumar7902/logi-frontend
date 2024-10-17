// src/slices/websocketSlice.js
import { createSlice } from '@reduxjs/toolkit';

const websocketSlice = createSlice({
  name: 'websocket',
  initialState: {
    isConnected: false,
    messages: [],
    error: null,
  },
  reducers: {
    websocketConnected(state) {
      state.isConnected = true;
    },
    websocketDisconnected(state) {
      state.isConnected = false;
    },
    receiveMessage(state, action) {
      state.messages.push(action.payload);
    },
    clearMessages(state) {
      state.messages = [];
    },
    // Optional: Handle errors
    websocketError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  websocketConnected,
  websocketDisconnected,
  receiveMessage,
  clearMessages,
  websocketError,
} = websocketSlice.actions;

export default websocketSlice.reducer;
