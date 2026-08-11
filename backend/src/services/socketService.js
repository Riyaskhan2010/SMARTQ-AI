// SmartQ AI - Socket.IO Service
const connectedClients = new Map(); // userId -> socketId

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client joins rooms
    socket.on('join:queue', ({ queueId }) => {
      socket.join(`queue:${queueId}`);
      console.log(`Socket ${socket.id} joined queue:${queueId}`);
    });

    socket.on('join:user', ({ userId }) => {
      socket.join(`user:${userId}`);
      connectedClients.set(userId, socket.id);
    });

    socket.on('join:admin', ({ organizationId }) => {
      socket.join(`admin:${organizationId}`);
    });

    socket.on('join:public', ({ departmentId }) => {
      socket.join(`public:${departmentId}`);
    });

    socket.on('join:staff', ({ counterId }) => {
      socket.join(`counter:${counterId}`);
    });

    socket.on('disconnect', () => {
      // Clean up connectedClients
      for (const [uid, sid] of connectedClients.entries()) {
        if (sid === socket.id) { connectedClients.delete(uid); break; }
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

// Emit helpers used by controllers
function emitQueueUpdated(io, queueId, data) {
  io.to(`queue:${queueId}`).emit('queueUpdated', data);
}
function emitTokenCalled(io, queueId, data) {
  io.to(`queue:${queueId}`).emit('tokenCalled', data);
  if (data.userId) io.to(`user:${data.userId}`).emit('tokenCalled', data);
}
function emitTokenCompleted(io, queueId, data) {
  io.to(`queue:${queueId}`).emit('tokenCompleted', data);
}
function emitCounterOpened(io, organizationId, data) {
  io.to(`admin:${organizationId}`).emit('counterOpened', data);
}
function emitCounterPaused(io, organizationId, data) {
  io.to(`admin:${organizationId}`).emit('counterPaused', data);
}
function emitEtaUpdated(io, queueId, data) {
  io.to(`queue:${queueId}`).emit('etaUpdated', data);
}
function emitCrowdUpdated(io, queueId, data) {
  io.to(`queue:${queueId}`).emit('crowdUpdated', data);
}
function emitNotification(io, userId, data) {
  io.to(`user:${userId}`).emit('notificationCreated', data);
}
function emitPublicDisplay(io, departmentId, data) {
  io.to(`public:${departmentId}`).emit('displayUpdated', data);
}

module.exports = {
  setupSocketHandlers,
  emitQueueUpdated, emitTokenCalled, emitTokenCompleted,
  emitCounterOpened, emitCounterPaused, emitEtaUpdated,
  emitCrowdUpdated, emitNotification, emitPublicDisplay,
};
