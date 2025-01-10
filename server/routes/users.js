const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendResetPasswordEmail } = require('../services/emailService');
const router = express.Router();
const nodemailer = require('nodemailer');
const cors = require('cors');

// Register a new user
router.post('/register', async (req, res) => {
    try {
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
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByCredentials(email, password);
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        res.status(400).json({ error: 'Invalid login credentials' });
    }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email
        }
    });
});

// Update user profile
router.patch('/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'email', 'password'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates' });
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Request password reset
router.post('/reset-password', cors(), async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Reset password request received for:', email);

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('No user found with email:', email);
            return res.json({
                message: 'If an account exists with that email, a password reset link will be sent.'
            });
        }

        console.log('Generating reset token...');
        const resetToken = user.createPasswordResetToken();
        await user.save();

        try {
            console.log('Attempting to send reset email...');
            await Promise.race([
                sendResetPasswordEmail(email, resetToken),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Email send timeout')), 30000)
                )
            ]);

            res.json({
                message: 'If an account exists with that email, a password reset link will be sent.',
                resetToken: resetToken // Remove in production
            });
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            throw new Error(`Failed to send password reset email: ${emailError.message}`);
        }
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            error: 'Error processing your request. Please try again later.',
            details: error.message
        });
    }
});

// Verify token and reset password
router.post('/reset-password/:token', cors(), async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Password reset verification error:', error);
        res.status(500).json({
            error: 'Error resetting password. Please try again later.'
        });
    }
});

// Add this route to test email configuration
router.get('/test-email-config', async (req, res) => {
    console.log('Test email config endpoint hit');
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
        console.error('Email config test error:', error);
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
});

// Add Gmail specific test endpoint
router.get('/test-gmail', async (req, res) => {
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
        console.error('Gmail test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            config: {
                user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : undefined,
                from: process.env.FROM_EMAIL
            }
        });
    }
});

// Add a simple test route
router.get('/test', (req, res) => {
    res.json({ message: 'User routes are working' });
});

// Add user search endpoint
router.get('/search', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ error: 'Error searching users' });
    }
});

module.exports = router; 