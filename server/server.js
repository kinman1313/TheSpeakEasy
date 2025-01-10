const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

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

// Configure Socket.IO with CORS
const io = socketIO(server, {
    cors: {
        origin: ["https://lies-client-9ayj.onrender.com", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling']
});

// CORS for Express
app.use(cors({
    origin: ["https://lies-client-9ayj.onrender.com", "http://localhost:3000"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

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
const users = new Map();

// Socket.IO event handlers
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (username) => {
        socket.username = username;
        users.set(socket.id, username);
        io.emit('userJoined', { username, users: Array.from(users.values()) });
    });

    socket.on('message', (data) => {
        const { handleMessage } = require('./socket/messageHandlers');
        handleMessage(io, socket, data);
    });

    socket.on('pinMessage', (data) => {
        const { handlePinMessage } = require('./socket/messageHandlers');
        handlePinMessage(io, socket, data);
    });

    socket.on('createDM', (data) => {
        const { handleCreateDM } = require('./socket/messageHandlers');
        handleCreateDM(io, socket, data);
    });

    socket.on('getHistory', (data) => {
        const { handleGetHistory } = require('./socket/messageHandlers');
        handleGetHistory(socket, data);
    });

    socket.on('typing', (data) => {
        const { handleTyping } = require('./socket/messageHandlers');
        handleTyping(io, socket, data);
    });

    socket.on('stopTyping', ({ username }) => {
        const { handleTyping } = require('./socket/messageHandlers');
        handleTyping(io, socket, {
            roomId: 'default',
            isTyping: false
        });
    });

    socket.on('reaction', (data) => {
        const { handleReaction } = require('./socket/messageHandlers');
        handleReaction(io, socket, data);
    });

    socket.on('removeReaction', (data) => {
        const { handleRemoveReaction } = require('./socket/messageHandlers');
        handleRemoveReaction(io, socket, data);
    });

    socket.on('getRooms', () => {
        const { handleGetRooms } = require('./socket/messageHandlers');
        handleGetRooms(socket);
    });

    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        users.delete(socket.id);
        io.emit('userLeft', { username, users: Array.from(users.values()) });
        console.log('Client disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 