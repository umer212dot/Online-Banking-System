import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        console.log('User logged out, disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Note: Token is stored as httpOnly cookie, so JavaScript cannot read it
    // The backend will automatically read it from cookies in the handshake
    // We just need to connect with withCredentials: true to send cookies automatically

    // Only create socket if we don't have one already
    if (!socketRef.current) {
      console.log('🔌 Initializing socket connection for user:', user.user_id);
      
      const newSocket = io('http://localhost:5000', {
        // Don't pass token in auth - backend will read from httpOnly cookie automatically
        withCredentials: true, // Important: sends httpOnly cookies with request
        transports: ['websocket', 'polling'], // Enable both transports
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        reconnectionDelayMax: 5000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket); // Update state so context re-renders
      console.log('📡 Socket instance created, state updated');

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('⚠️ Socket connection error:', err.message);
        setIsConnected(false);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('⚠️ Socket reconnection error:', error.message);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed - will keep trying');
        setIsConnected(false);
      });
    } else if (socketRef.current && !socketRef.current.connected) {
      // If socket exists but is disconnected, try to reconnect
      console.log('Socket exists but disconnected, attempting to reconnect...');
      socketRef.current.connect();
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive across page navigations
      // Only disconnect when user logs out (handled by the user check above)
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketProvider;

