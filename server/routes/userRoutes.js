const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars/');
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        cb(null, `${uniqueId}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
            return;
        }
        cb(null, true);
    }
});

// Ensure upload directory exists
const ensureUploadDir = async () => {
    const dir = 'uploads/avatars';
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
};

ensureUploadDir();

// Upload avatar endpoint
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const user = req.user;
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // Delete old avatar if it exists
        if (user.avatarUrl) {
            const oldAvatarPath = path.join(__dirname, '..', user.avatarUrl);
            try {
                await fs.unlink(oldAvatarPath);
            } catch (err) {
                console.error('Error deleting old avatar:', err);
            }
        }

        // Update user's avatar URL in database
        user.avatarUrl = avatarUrl;
        await user.save();

        res.json({ avatarUrl });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// Serve avatar files
router.get('/uploads/avatars/:filename', (req, res) => {
    const filePath = path.join(__dirname, '../uploads/avatars', req.params.filename);
    res.sendFile(filePath);
});

module.exports = router; 