// src/hooks/useWebSocket.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { receiveMessage } from '../slices/websocketSlice';

const useWebSocket = (url) => {
  const dispatch = useDispatch();
  const isConnected = useSelector((state) => state.websocket.isConnected);

  useEffect(() => {
    if (!url) return;

    // Dispatch action to connect
    dispatch({ type: 'websocket/connect', payload: { url } });

    // Cleanup on unmount
    return () => {
      dispatch({ type: 'websocket/disconnect' });
    };
  }, [url, dispatch]);

  return isConnected;
};

export default useWebSocket;
