const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Room = require('../models/Room');

// Configure multer for voice message uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../uploads/voice');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'voice-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'));
        }
    }
});

// Upload voice message
router.post('/voice', auth, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const { roomId } = req.body;
        if (!roomId) {
            return res.status(400).json({ error: 'Room ID is required' });
        }

        // Check if room exists and user is a member
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Create voice message
        const message = new Message({xx
            type: 'voice',
            content: `/uploads/voice/${req.file.filename}`,
            room: roomId,
            sender: req.user._id,
            metadata: {
                duration: req.body.duration,
                mimeType: req.file.mimetype,
                size: req.file.size
            }
        });

        await message.save();
        await room.updateActivity();

        // Populate sender information
        await message.populate('sender', 'username avatarUrl');

        // Emit to room via Socket.IO
        req.app.get('io').to(roomId).emit('new_message', message);

        res.status(201).json({ message });
    } catch (error) {
        console.error('Error uploading voice message:', error);
        res.status(500).json({ error: 'Failed to upload voice message' });
    }
});

// Get voice message
router.get('/voice/:filename', auth, (req, res) => {
    const filePath = path.join(__dirname, '../uploads/voice', req.params.filename);
    res.sendFile(filePath);
});

module.exports = router; 