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
            const newSocket = io('http://localhost:8080', {
                transports: ['polling', 'websocket'],
                withCredentials: false,
                autoConnect: true,
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                auth: {
                    token: localStorage.getItem('token')
                },
                path: '/socket.io'
            });

            // Socket event listeners
            newSocket.on('connect', () => {
                console.log('Socket connected successfully');
                // Join default room after connection
                if (user.username) {
                    newSocket.emit('join_default', { username: user.username });
                }
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                // Try to reconnect with polling if websocket fails
                if (newSocket.io.opts.transports[0] === 'websocket') {
                    console.log('Falling back to polling transport');
                    newSocket.io.opts.transports = ['polling'];
                }
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                if (reason === 'io server disconnect') {
                    // Server initiated disconnect, try reconnecting
                    setTimeout(() => {
                        newSocket.connect();
                    }, 1000);
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