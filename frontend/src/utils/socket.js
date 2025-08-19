// frontend/src/utils/socket.js
import { io } from 'socket.io-client';

// Single shared instance
export const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  autoConnect: true,
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500
});

// Optional: expose a helper to (re)attach auth later if you ever need it
export const ensureConnected = () => {
  if (!socket.connected) socket.connect();
};

export default socket;
