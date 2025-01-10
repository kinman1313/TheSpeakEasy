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
                autoConnect: true,
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 60000, // 60 seconds
                auth: {
                    token: user.token
                }
            });

            // Socket event listeners
            newSocket.on('connect', () => {
                console.log('Socket connected successfully');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                // Try to reconnect with polling if websocket fails
                if (newSocket.io.opts.transports.includes('websocket')) {
                    console.log('Falling back to polling transport');
                    newSocket.io.opts.transports = ['polling'];
                }
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                if (reason === 'io server disconnect') {
                    // Server initiated disconnect, try reconnecting
                    newSocket.connect();
                }
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                if (newSocket) {
                    newSocket.removeAllListeners();
                    newSocket.close();
                }
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