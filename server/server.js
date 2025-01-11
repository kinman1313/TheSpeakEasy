const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const path = require('path');

// Import models
const Room = require('./models/Room');
const Message = require('./models/Message');

// Check for required environment variables first
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'FROM_EMAIL',
    'CLIENT_URL'
];

// Check for required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('MongoDB connection error:', error));

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS and timeout settings
const io = socketIO(server, {
    cors: {
        origin: [
            "https://lies-client-9ayj.onrender.com",
            "http://localhost:3000",
            "https://thespeakeasy.onrender.com"
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 60000,
    path: '/socket.io'
});

// CORS middleware for Express
app.use(cors({
    origin: [
        "https://lies-client-9ayj.onrender.com",
        "http://localhost:3000",
        "https://thespeakeasy.onrender.com"
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Add OPTIONS handling for preflight requests
app.options('*', cors({
    origin: [
        "https://lies-client-9ayj.onrender.com",
        "http://localhost:3000",
        "https://thespeakeasy.onrender.com"
    ],
    credentials: true
}));

// Add CORS headers middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Authorization');
    next();
});

// Increase server timeout
server.timeout = 60000; // 60 seconds

// Add body parser with increased limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import and mount routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Add a root test route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Add a catch-all route for debugging
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.originalUrl,
        method: req.method
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Store connected users
const connectedUsers = new Map();

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle errors on the socket
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    socket.on('join', (username) => {
        try {
            console.log('User joined:', username);
            connectedUsers.set(socket.id, {
                username,
                joinedAt: new Date().toISOString()
            });

            // Broadcast updated user list
            const userList = Array.from(connectedUsers.values());
            console.log('Current users:', userList);
            io.emit('userList', userList);
        } catch (error) {
            console.error('Error in join handler:', error);
            socket.emit('error', 'Failed to join chat');
        }
    });

    socket.on('message', async (message) => {
        try {
            console.log('Received message:', message);

            const user = connectedUsers.get(socket.id);
            if (!user) {
                socket.emit('error', { message: 'User not found' });
                return;
            }

            // Create and save the message
            const newMessage = new Message({
                type: 'text',
                content: message.content,
                roomId: message.roomId,
                username: user.username,
                metadata: {},
                timestamp: new Date().toISOString()
            });

            await newMessage.save();

            // Broadcast message to room
            io.to(message.roomId).emit('message', {
                ...newMessage.toObject(),
                _id: newMessage._id.toString()
            });
        } catch (error) {
            console.error('Error in message handler:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    socket.on('typing', ({ isTyping, username }) => {
        try {
            console.log('Typing event:', { username, isTyping });
            socket.broadcast.emit('typing', { username, isTyping });
        } catch (error) {
            console.error('Error in typing handler:', error);
        }
    });

    socket.on('disconnect', () => {
        try {
            const user = connectedUsers.get(socket.id);
            console.log('Client disconnected:', socket.id, user?.username);
            connectedUsers.delete(socket.id);
            const userList = Array.from(connectedUsers.values());
            console.log('Remaining users:', userList);
            io.emit('userList', userList);
        } catch (error) {
            console.error('Error in disconnect handler:', error);
        }
    });

    // Join room
    socket.on('join_room', async (roomId) => {
        try {
            const room = await Room.findById(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            const user = connectedUsers.get(socket.id);
            if (!user) {
                socket.emit('error', { message: 'User not found' });
                return;
            }

            socket.join(roomId);
            socket.to(roomId).emit('user_joined', {
                socketId: socket.id,
                username: user.username
            });

            // Get recent messages for this room
            const messages = await Message.find({ roomId })
                .sort('-timestamp')
                .limit(50)
                .exec();

            socket.emit('room_messages', {
                roomId,
                messages: messages.reverse()
            });
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });

    // Leave room
    socket.on('leave_room', async (roomId) => {
        try {
            socket.leave(roomId);
            socket.to(roomId).emit('user_left', {
                userId: socket.user._id,
                username: socket.user.username
            });
        } catch (error) {
            console.error('Error leaving room:', error);
            socket.emit('error', { message: 'Failed to leave room' });
        }
    });

    // Send message to room
    socket.on('send_message', async ({ roomId, content, type = 'text', vanishTime = null }) => {
        try {
            const room = await Room.findById(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            if (!room.members.includes(socket.user._id)) {
                socket.emit('error', { message: 'Not a member of this room' });
                return;
            }

            const message = new Message({
                room: roomId,
                sender: socket.user._id,
                content,
                type,
                vanishTime
            });

            await message.save();
            await room.updateActivity();

            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'username avatarUrl')
                .exec();

            io.to(roomId).emit('new_message', populatedMessage);

            // Handle vanishing messages
            if (vanishTime) {
                setTimeout(async () => {
                    await Message.deleteOne({ _id: message._id });
                    io.to(roomId).emit('message_vanished', message._id);
                }, vanishTime * 1000);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Update room topic
    socket.on('update_topic', async ({ roomId, topic }) => {
        try {
            const room = await Room.findById(roomId);
            if (!room) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            if (!room.admins.includes(socket.user._id)) {
                socket.emit('error', { message: 'Not authorized to update topic' });
                return;
            }

            room.topic = topic;
            await room.save();

            io.to(roomId).emit('topic_updated', {
                roomId,
                topic
            });
        } catch (error) {
            console.error('Error updating topic:', error);
            socket.emit('error', { message: 'Failed to update topic' });
        }
    });
});

// Add WebSocket specific error handling
io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Error handler for CORS issues
app.use((err, req, res, next) => {
    if (err.name === 'CORSError') {
        console.error('CORS Error:', err);
        res.status(403).json({
            error: 'CORS Error',
            message: err.message,
            origin: req.headers.origin
        });
    } else {
        next(err);
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 