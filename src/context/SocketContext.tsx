import React ,{ createContext, useContext , useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

import { BASE_SERVER_URL } from '../services/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}
const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL = BASE_SERVER_URL;
    const newSocket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        autoConnect: true
    });

    newSocket.on('connect', () => {
        console.log('Socket connected successfully!');
        setIsConnected(true);
    });
    newSocket.on('disconnect', () => {
        console.log('Socket disconnected!');
        setIsConnected(false);
    });  

    setSocket(newSocket);

    return () => {
        newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}           

export const useSocket = () => useContext(SocketContext);
