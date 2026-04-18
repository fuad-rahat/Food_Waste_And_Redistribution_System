const { Server } = require('socket.io');
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://foodrescuebd.vercel.app',
        'https://foodsharebd.vercel.app'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Identify user and join room
    socket.on('register', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`Socket ${socket.id} joined room ${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const sendNotification = (userId, data) => {
  if (!io) return;
  // Send to all sockets in the user's room (multi-tab support)
  io.to(userId.toString()).emit('new_notification', data);
  console.log(`Notification signal sent to room ${userId}`);
};

const getIO = () => io;

module.exports = { initSocket, sendNotification, getIO };
