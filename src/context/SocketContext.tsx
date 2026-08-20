import React ,{ createContext, useContext , useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}
const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const rawUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin.replace('3000', '5001');
    const SOCKET_URL = rawUrl.replace('/api', '');
    const newSocket = io(SOCKET_URL, {
        transports: ['websocket'],
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
