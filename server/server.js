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

// 1. Proxy trust first
app.set('trust proxy', 1);

// 2. SINGLE Socket.IO instance with proper configuration
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
    transports: ['websocket', 'polling'],
    path: '/socket.io/' // Keep this path for Render compatibility
});

// 3. Attach io to requests
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Apply security middleware
securityMiddleware(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize message services with the io instance
const messageScheduler = new MessageScheduler(io);
const messageVanisher = new MessageVanisher(io);

// Cleanup on server shutdown
process.on('SIGTERM', () => {
    messageScheduler.cleanup();
    messageVanisher.cleanup();
    process.exit(0);
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));

// Socket authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    // Add token verification logic here
    next();
});

// Socket events
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('schedule_message', async (data) => {
        // ... existing handler ...
    });

    socket.on('set_message_vanish', async (data) => {
        // ... existing handler ...
    });

    // ... other event handlers ...
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .then(async () => {
        console.log('\nStorage Configuration:');
        console.log('Avatar Directory:', config.AVATAR_DIR);
        console.log('Voice Messages Directory:', config.VOICE_MESSAGE_DIR);

        // Directory checks
        await ensureUploadDirs();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// File serving
app.use('/uploads/avatars', express.static(config.AVATAR_DIR));
app.use('/uploads/voice-messages', express.static(config.VOICE_MESSAGE_DIR));

// Directory management
async function ensureUploadDirs() {
    const createDir = async (path) => {
        try {
            await fs.access(path);
        } catch {
            await fs.mkdir(path, { recursive: true });
            console.log(`Created directory: ${path}`);
            if (process.env.RENDER_DISK_PATH) {
                await fs.chmod(path, 0o755);
            }
        }
    };

    await createDir(config.AVATAR_DIR);
    await createDir(config.VOICE_MESSAGE_DIR);
}

// Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://0.0.0.0:${PORT}/socket.io/`);
});