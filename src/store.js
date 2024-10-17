// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import websocketReducer from './slices/websocketSlice';
import websocketMiddleware from './middleware/websocketMiddleware';

const store = configureStore({
  reducer: {
    websocket: websocketReducer,
    // Add other reducers here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(websocketMiddleware),
});

export default store;
