const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Configure multer for voice message uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const dir = path.join(__dirname, '..', 'uploads', 'voice-messages');
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        cb(null, `${uniqueId}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('Invalid file type. Only WEBM, MP4, MP3 and OGG audio are allowed.'));
            return;
        }
        cb(null, true);
    }
});

// Upload voice message
router.post('/voice', auth, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        // Generate URL for the uploaded file
        const voiceUrl = `/uploads/voice-messages/${req.file.filename}`;

        res.json({
            success: true,
            voiceUrl: voiceUrl,
            duration: req.body.duration
        });
    } catch (error) {
        console.error('Voice message upload error:', error);
        res.status(500).json({ error: 'Failed to upload voice message' });
    }
});

// Get voice message
router.get('/voice/:filename', auth, async (req, res) => {
    try {
        const filePath = path.join(__dirname, '..', 'uploads', 'voice-messages', req.params.filename);
        res.sendFile(filePath);
    } catch (error) {
        console.error('Voice message retrieval error:', error);
        res.status(404).json({ error: 'Voice message not found' });
    }
});

module.exports = router; 