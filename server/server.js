const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('MongoDB connection error:', error));

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
    origin: ['https://lies-client-9ayj.onrender.com', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Socket.IO CORS configuration
const io = socketIO(server, {
    cors: {
        origin: ['https://lies-client-9ayj.onrender.com', 'http://localhost:3000'],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }
});

app.use(express.json());

// Import routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join', (username) => {
        users.set(socket.id, username);
        io.emit('userJoined', { username, users: Array.from(users.values()) });
    });

    socket.on('message', (message) => {
        const username = users.get(socket.id);
        const messageData = {
            text: message,
            username,
            timestamp: new Date().toISOString(),
            reactions: []
        };
        io.emit('message', messageData);
    });

    socket.on('typing', ({ username }) => {
        io.emit('typing', { username });
    });

    socket.on('stopTyping', ({ username }) => {
        io.emit('stopTyping', { username });
    });

    socket.on('reaction', ({ messageId, emoji, username }) => {
        io.emit('reaction', { messageId, emoji, username });
    });

    socket.on('removeReaction', ({ messageId, emoji, username }) => {
        io.emit('removeReaction', { messageId, emoji, username });
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