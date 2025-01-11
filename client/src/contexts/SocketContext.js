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
            console.log('Initializing socket connection with user:', user.username);

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
                console.log('Socket connected successfully', {
                    id: newSocket.id,
                    connected: newSocket.connected,
                    transport: newSocket.io.engine.transport.name
                });

                // Join default room after connection
                if (user.username) {
                    console.log('Attempting to join default room with username:', user.username);
                    newSocket.emit('join_default', { username: user.username });
                }
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', {
                    message: error.message,
                    description: error.description,
                    type: error.type,
                    transport: newSocket.io?.engine?.transport?.name
                });

                // Try to reconnect with polling if websocket fails
                if (newSocket.io.opts.transports[0] === 'websocket') {
                    console.log('Falling back to polling transport');
                    newSocket.io.opts.transports = ['polling'];
                }
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', {
                    error,
                    socketId: newSocket.id,
                    connected: newSocket.connected
                });
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', {
                    reason,
                    socketId: newSocket.id,
                    wasConnected: newSocket.connected,
                    transport: newSocket.io?.engine?.transport?.name
                });

                if (reason === 'io server disconnect') {
                    // Server initiated disconnect, try reconnecting
                    console.log('Attempting reconnection after server disconnect');
                    setTimeout(() => {
                        newSocket.connect();
                    }, 1000);
                }
            });

            // Add handlers for room events
            newSocket.on('room_joined', (data) => {
                console.log('Successfully joined room:', data);
            });

            newSocket.on('room_error', (error) => {
                console.error('Room error:', error);
            });

            setSocket(newSocket);

            // Cleanup on unmount
            return () => {
                console.log('Cleaning up socket connection');
                if (newSocket) {
                    newSocket.removeAllListeners();
                    newSocket.close();
                }
            };
        } else {
            console.log('No user available for socket connection');
        }
    }, [user]);

    const value = {
        socket,
        connected: socket?.connected || false
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}; 