import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  });

  // Socket.io authentication middleware
  io.use((socket, next) => {
    // Try to get token from auth object first, then from cookies
    let token = socket.handshake.auth.token;
    
    if (!token) {
      // Try to extract from cookie header
      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        // Parse cookies from header string
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key && value) {
            acc[key.trim()] = decodeURIComponent(value.trim());
          }
          return acc;
        }, {});
        token = cookies.token;
        console.log('Cookie header found, token extracted:', !!token);
      } else {
        console.log('No cookie header in handshake');
      }
    }
    
    if (!token) {
      console.error('No token found in socket handshake');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      console.log('Socket authenticated for user:', socket.userId);
      next();
    } catch (err) {
      console.error('Token verification failed:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

