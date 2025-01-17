const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const roomRoutes = require('./routes/rooms');

const app = express();

// Define base upload directory based on environment
const BASE_UPLOAD_DIR = process.env.NODE_ENV === 'production'
    ? '/opt/render/project/uploads'
    : path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
const avatarsDir = path.join(BASE_UPLOAD_DIR, 'avatars');

// Ensure directories exist
[BASE_UPLOAD_DIR, avatarsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            "https://lies-client-9ayj.onrender.com",
            "http://localhost:3000",
            "https://thespeakeasy.onrender.com"
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origin not allowed'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(BASE_UPLOAD_DIR));

// Routes
app.use('/api', userRoutes);
app.use('/api', chatRoutes);
app.use('/api', roomRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app; 