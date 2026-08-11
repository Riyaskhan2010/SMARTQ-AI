import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false, reconnection: true, reconnectionAttempts: 5 });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();
  if (!s.connected) s.connect();
  if (userId) s.emit('join:user', { userId });
  return s;
};

export const joinQueue = (queueId) => {
  getSocket().emit('join:queue', { queueId });
};

export const joinAdmin = (organizationId) => {
  getSocket().emit('join:admin', { organizationId });
};

export const joinPublic = (departmentId) => {
  getSocket().emit('join:public', { departmentId });
};

export const joinStaff = (counterId) => {
  getSocket().emit('join:staff', { counterId });
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
