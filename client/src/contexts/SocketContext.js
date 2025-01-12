import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { config } from '../config';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    const connectSocket = useCallback(() => {
        if (!user?.token) return;

        const newSocket = io(config.API_URL, {
            auth: {
                token: user.token
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
            // Don't disconnect on error, let reconnection handle it
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            setIsConnected(true);
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed');
            // Attempt to create a new socket connection
            setTimeout(connectSocket, 5000);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [user?.token]);

    useEffect(() => {
        const cleanup = connectSocket();
        return cleanup;
    }, [connectSocket]);

    const joinRoom = useCallback((roomId) => {
        if (!socket?.connected || !roomId) return;

        return new Promise((resolve, reject) => {
            socket.emit('join_room', { roomId }, (response) => {
                if (response?.error) {
                    console.error('Failed to join room:', response.error);
                    reject(response.error);
                } else {
                    console.log('Successfully joined room:', roomId);
                    resolve(response);
                }
            });
        });
    }, [socket]);

    const leaveRoom = useCallback((roomId) => {
        if (!socket?.connected || !roomId) return;

        return new Promise((resolve) => {
            socket.emit('leave_room', { roomId }, (response) => {
                console.log('Left room:', roomId);
                resolve(response);
            });
        });
    }, [socket]);

    const value = {
        socket,
        isConnected,
        joinRoom,
        leaveRoom
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
} 