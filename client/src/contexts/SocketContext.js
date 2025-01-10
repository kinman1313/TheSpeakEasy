import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            // Create socket connection
            const newSocket = io(process.env.REACT_APP_API_URL, {
                transports: ['websocket', 'polling'],
                withCredentials: true,
                extraHeaders: {
                    'Access-Control-Allow-Origin': window.location.origin
                },
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
                auth: {
                    token: user.token
                }
            });

            // Socket event listeners
            newSocket.on('connect', () => {
                console.log('Socket connected');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                newSocket.close();
            };
        }
    }, [user]);

    const value = {
        socket,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}; 