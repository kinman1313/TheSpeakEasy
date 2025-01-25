const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendResetPasswordEmail } = require('../services/emailService');
const router = express.Router();
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { check, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const rateLimit = require('express-rate-limit');
const sanitize = require('sanitize-filename');

// Rate limiter middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

router.use(limiter);

// Configure multer for avatar uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            await fs.access(config.AVATAR_DIR);
        } catch {
            await fs.mkdir(config.AVATAR_DIR, { recursive: true });
        }
        cb(null, config.AVATAR_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueId = uuidv4();
        cb(null, `${uniqueId}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.MAX_AVATAR_SIZE
    },
    fileFilter: (req, file, cb) => {
        if (!config.ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
            return;
        }
        cb(null, true);
    }
});

// Ensure upload directory exists
const ensureUploadDir = async () => {
    const dir = config.AVATAR_DIR;
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
};

ensureUploadDir();

// Validation middleware
const validateUserRegistration = [
    check('username').notEmpty().withMessage('Username is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const validateUserLogin = [
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').notEmpty().withMessage('Password is required')
];

// Register a new user
router.post('/register', validateUserRegistration, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        return res.status(400).json({
            error: 'Username or email already exists'
        });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });

    res.status(201).json({
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        },
        token
    });
}));

// Login user
router.post('/login', validateUserLogin, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });

    res.json({
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl
        },
        token
    });
}));

// Get current user profile
router.get('/me', auth, asyncHandler(async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email
        }
    });
}));

// Update user profile
router.patch('/me', auth, asyncHandler(async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'email', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates' });
    }

    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json({
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email
        }
    });
}));

// Upload avatar
router.post('/upload-avatar', auth, upload.single('avatar'), asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the old avatar filename if it exists
    const user = await User.findById(req.user._id);
    const oldAvatarPath = user.avatarUrl ? path.join(config.AVATAR_DIR, path.basename(user.avatarUrl)) : null;

    // Generate the URL for the new uploaded file
    const avatarUrl = `${config.AVATAR_URL_PATH}/${req.file.filename}`;

    // Update user's avatarUrl in the database
    user.avatarUrl = avatarUrl;
    await user.save();

    // Delete old avatar file if it exists and isn't the default avatar
    if (oldAvatarPath && !oldAvatarPath.includes('default-avatar')) {
        try {
            await fs.unlink(oldAvatarPath);
        } catch (error) {
            console.error('Error deleting old avatar:', error);
            // Don't throw error if file deletion fails
        }
    }

    // Return success response with the new avatar URL
    res.json({
        success: true,
        avatarUrl: avatarUrl
    });
}), (error, req, res, next) => {
    // Error handling middleware for multer errors
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
});

// Serve avatar files
router.get('/avatars/:filename', asyncHandler(async (req, res) => {
    const sanitizedFilename = sanitize(req.params.filename);
    const filePath = path.join(config.AVATAR_DIR, sanitizedFilename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'Avatar not found' });
        }
    });
}));

// Request password reset
router.post('/reset-password', cors(), asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        return res.json({
            message: 'If an account exists with that email, a password reset link will be sent.'
        });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    try {
        await Promise.race([
            sendResetPasswordEmail(email, resetToken),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Email send timeout')), 30000)
            )
        ]);

        res.json({
            message: 'If an account exists with that email, a password reset link will be sent.'
        });
    } catch (emailError) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        throw new Error(`Failed to send password reset email: ${emailError.message}`);
    }
}));

// Verify token and reset password
router.post('/reset-password/:token', cors(), asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    if (!password) {
        return res.status(400).json({ error: 'New password is required' });
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({
            error: 'Password reset token is invalid or has expired'
        });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
}));

// Add this route to test email configuration
router.get('/test-email-config', asyncHandler(async (req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            debug: true
        });

        // Verify the connection configuration
        await transporter.verify();

        res.json({
            success: true,
            message: 'Email configuration is valid',
            config: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER ? '****' : undefined,
                from: process.env.FROM_EMAIL
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            config: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                user: process.env.SMTP_USER ? '****' : undefined,
                from: process.env.FROM_EMAIL
            }
        });
    }
}));

// Add Gmail specific test endpoint
router.get('/test-gmail', asyncHandler(async (req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS // This should be your Gmail App Password
            },
            debug: true
        });

        // Test sending an actual email
        const testResult = await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: process.env.SMTP_USER, // Send to yourself as a test
            subject: 'Email Service Test',
            text: 'If you receive this email, your email service is working correctly.',
            html: '<h1>Email Service Test</h1><p>If you receive this email, your email service is working correctly.</p>'
        });

        res.json({
            success: true,
            message: 'Test email sent successfully',
            messageId: testResult.messageId,
            config: {
                user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : undefined,
                from: process.env.FROM_EMAIL
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            config: {
                user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : undefined,
                from: process.env.FROM_EMAIL
            }
        });
    }
}));

// Add a simple test route
router.get('/test', (req, res) => {
    res.json({ message: 'User routes are working' });
});

<<<<<<< HEAD
module.exports = router;












=======
// Add user search endpoint
router.get('/search', auth, asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.json({ users: [] });
    }

    const users = await User.find({
        $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
        ],
        _id: { $ne: req.user._id } // Exclude current user
    })
        .select('username email')
        .limit(10);

    res.json({ users });
}));

module.exports = router;

>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
