import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getToken, getUserFromToken } from '../utils/auth';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const user = getUserFromToken();
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        
        // Ensure we only use the origin part for the socket connection
        const socketUrl = new URL(apiBaseUrl).origin;

        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            if (user && user.id) {
                newSocket.emit('register', user.id);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [getToken()]); // Re-run when token changes (login/logout)

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
