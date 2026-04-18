const { Server } = require('socket.io');

let io;
const userSockets = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://foodrescuebd.vercel.app',
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Identify user
    socket.on('register', (userId) => {
      if (userId) {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      // Remove from map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
};

const sendNotification = (userId, data) => {
  if (!io) return;
  const socketId = userSockets.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit('new_notification', data);
    console.log(`Notification sent to user ${userId}`);
  } else {
    console.log(`User ${userId} not connected, notification stored in DB only.`);
  }
};

const getIO = () => io;

module.exports = { initSocket, sendNotification, getIO };
