import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

let socket: Socket | null = null;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      
      if (!socket) {
        const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';
        
        socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 5,
          timeout: 10000,
        });

        socket.on('connect', () => {
          console.log('Socket connected:', socket?.id);
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        socket.on('connect_error', (error) => {
          console.warn('Socket connection failed - real-time features disabled:', error.message);
        });
      }
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};