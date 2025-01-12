const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const securityMiddleware = require('./middleware/security');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const MessageScheduler = require('./services/messageScheduler');
const MessageVanisher = require('./services/messageVanisher');
const config = require('./config');
const fs = require('fs/promises');

const app = express();
const server = http.createServer(app);

// Apply security middleware first
securityMiddleware(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.IO setup with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'https://lies-client-9ayj.onrender.com',
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    }
});

// Initialize message services
const messageScheduler = new MessageScheduler(io);
const messageVanisher = new MessageVanisher(io);

// Cleanup on server shutdown
process.on('SIGTERM', () => {
    messageScheduler.cleanup();
    messageVanisher.cleanup();
    process.exit(0);
});

// Import routes
const userRoutes = require('./routes/users');
const roomRoutes = require('./routes/rooms');
const messageRoutes = require('./routes/messages');

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// Socket authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    // Verify token here if needed
    next();
});

// Socket connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('schedule_message', async (data) => {
        try {
            const messageId = messageScheduler.scheduleMessage({
                id: uuidv4(),
                content: data.content,
                roomId: data.roomId,
                userId: socket.user._id,
                scheduledTime: data.scheduledTime
            });
            socket.emit('message_scheduled', { messageId });
        } catch (error) {
            console.error('Error scheduling message:', error);
            socket.emit('schedule_error', { error: 'Failed to schedule message' });
        }
    });

    socket.on('set_message_vanish', async (data) => {
        try {
            const { messageId, vanishTime } = messageVanisher.addVanishingMessage(
                data.message,
                data.vanishTime
            );
            io.to(data.message.room).emit('message_vanish_set', {
                messageId,
                vanishTime
            });
        } catch (error) {
            console.error('Error setting message vanish:', error);
            socket.emit('vanish_error', { error: 'Failed to set message vanish time' });
        }
    });

    socket.on('join_room', async ({ roomId }, callback) => {
        try {
            await socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
            callback({ success: true });
        } catch (error) {
            console.error('Error joining room:', error);
            callback({ error: 'Failed to join room' });
        }
    });

    socket.on('leave_room', async ({ roomId }, callback) => {
        try {
            await socket.leave(roomId);
            console.log(`User ${socket.id} left room ${roomId}`);
            callback({ success: true });
        } catch (error) {
            console.error('Error leaving room:', error);
            callback({ error: 'Failed to leave room' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Serve static files from upload directories
app.use('/uploads/avatars', express.static(config.AVATAR_DIR));
app.use('/uploads/voice-messages', express.static(config.VOICE_MESSAGE_DIR));

// Create upload directories if they don't exist
async function ensureUploadDirs() {
    try {
        await fs.access(config.AVATAR_DIR);
    } catch {
        await fs.mkdir(config.AVATAR_DIR, { recursive: true });
    }
    try {
        await fs.access(config.VOICE_MESSAGE_DIR);
    } catch {
        await fs.mkdir(config.VOICE_MESSAGE_DIR, { recursive: true });
    }
}

// Initialize upload directories
ensureUploadDirs().catch(console.error);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 