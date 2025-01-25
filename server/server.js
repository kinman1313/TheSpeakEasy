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
        origin: [
            process.env.CLIENT_URL || 'https://lies-client-9ayj.onrender.com',
            'http://localhost:3000'
        ],
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
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

// Socket connection handling (no changes needed here)
io.on('connection', (socket) => {
    // ... existing socket handlers remain unchanged ...
});

// Connect to MongoDB - corrected version
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .then(async () => {  // Properly chained then()
        console.log('\nStorage Configuration:');
        console.log('Avatar Directory:', config.AVATAR_DIR);
        console.log('Voice Messages Directory:', config.VOICE_MESSAGE_DIR);

        try {
            await fs.access(config.AVATAR_DIR);
            console.log('Avatar directory exists');
        } catch {
            console.log('Avatar directory does not exist yet');
        }

        try {
            await fs.access(config.VOICE_MESSAGE_DIR);
            console.log('Voice messages directory exists');
        } catch {
            console.log('Voice messages directory does not exist yet');
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Serve static files from upload directories (no changes needed)
app.use('/uploads/avatars', express.static(config.AVATAR_DIR));
app.use('/uploads/voice-messages', express.static(config.VOICE_MESSAGE_DIR));

// MODIFIED: Enhanced directory creation with permissions
async function ensureUploadDirs() {
    try {
        await fs.access(config.AVATAR_DIR);
    } catch {
        await fs.mkdir(config.AVATAR_DIR, { recursive: true });
        console.log('Created avatar directory:', config.AVATAR_DIR);
    }

    try {
        await fs.access(config.VOICE_MESSAGE_DIR);
    } catch {
        await fs.mkdir(config.VOICE_MESSAGE_DIR, { recursive: true });
        console.log('Created voice messages directory:', config.VOICE_MESSAGE_DIR);
    }

    // NEW: Set permissions for Render persistent disk
    if (process.env.RENDER_DISK_PATH) {
        await fs.chmod(config.AVATAR_DIR, 0o755);
        await fs.chmod(config.VOICE_MESSAGE_DIR, 0o755);
        console.log('Set directory permissions for production');
    }
}

// Initialize upload directories
ensureUploadDirs()
    .catch((err) => {
        console.error('Failed to initialize upload directories:');
        console.error(err);
        process.exit(1); // Exit if directories can't be created
    });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});









