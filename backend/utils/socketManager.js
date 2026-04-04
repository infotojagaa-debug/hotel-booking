let io;
const activeUsers = new Map(); // Maps string user IDs to socket IDs

module.exports = {
  init: (socketIoInstance) => {
    io = socketIoInstance;
    
    io.on('connection', (socket) => {
      console.log('A user connected via socket:', socket.id);
      
      // When a user logs in / connects, they emit this event
      socket.on('register', (userId) => {
        activeUsers.set(userId.toString(), socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
      });
      
      socket.on('disconnect', () => {
        for (let [userId, socketId] of activeUsers.entries()) {
          if (socketId === socket.id) {
            activeUsers.delete(userId);
            console.log(`User ${userId} disconnected via socket ${socket.id}`);
            break;
          }
        }
      });
    });
  },
  
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
  
  sendNotificationToUser: (userId, notificationData) => {
    if (!io) return;
    const socketId = activeUsers.get(userId.toString());
    if (socketId) {
      io.to(socketId).emit('newNotification', notificationData);
    }
  }
};
