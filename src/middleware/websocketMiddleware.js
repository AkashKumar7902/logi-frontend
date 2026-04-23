// src/middleware/websocketMiddleware.js

import ReconnectingWebSocket from 'reconnecting-websocket';
import { websocketConnected, websocketDisconnected, receiveMessage, websocketError } from '../slices/websocketSlice';

const websocketMiddleware = (storeAPI) => {
  let socket = null;

  return (next) => (action) => {
    switch (action.type) {
      case 'websocket/connect':
        if (socket !== null) {
          socket.close();
        }

        socket = new ReconnectingWebSocket(action.payload.url);

        socket.addEventListener('open', () => {
          storeAPI.dispatch(websocketConnected());
        });

        socket.addEventListener('close', () => {
          storeAPI.dispatch(websocketDisconnected());
        });

        socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            storeAPI.dispatch(receiveMessage(data));
          } catch (error) {
            storeAPI.dispatch(websocketError('Invalid WebSocket payload received'));
          }
        });

        socket.addEventListener('error', () => {
          storeAPI.dispatch(websocketError('WebSocket connection error'));
        });
        break;

      case 'websocket/disconnect':
        if (socket !== null) {
          socket.close();
        }
        socket = null;
        break;

      case 'websocket/sendMessage':
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(action.payload.message));
        }
        break;

      default:
        break;
    }

    return next(action);
  };
};

export default websocketMiddleware;
