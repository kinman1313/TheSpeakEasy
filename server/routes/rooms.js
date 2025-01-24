const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const rateLimit = require('express-rate-limit');

// Rate limiter middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

router.use(limiter);

// Validation middleware
const validateRoom = [
    check('name').notEmpty().withMessage('Room name is required')
        .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Room name can only contain letters, numbers, hyphens, and underscores')
        .isLength({ min: 3, max: 30 }).withMessage('Room name must be between 3 and 30 characters'),
    check('isPrivate').isBoolean().optional(),
    check('password').notEmpty().withMessage('Password is required for private rooms').optional({ checkFalsy: true })
];

// Get all rooms
router.get('/', auth, asyncHandler(async (req, res) => {
    // First, ensure public lobby exists
    let publicLobby = await Room.findOne({ name: 'public-lobby' });
    if (!publicLobby) {
        publicLobby = new Room({
            name: 'public-lobby',
            topic: 'Welcome to The SpeakEasy',
            isPrivate: false,
            creator: null,
            members: [],
            admins: [],
            memberCount: 0
        });
        await publicLobby.save();
    }

    // Get all rooms including public lobby
    const rooms = await Room.find()
        .sort('-lastActivity')
        .populate('members', 'username avatarUrl')
        .populate('admins', 'username avatarUrl')
        .exec();

    res.json({ rooms });
}));

// Create a new room
router.post('/', auth, validateRoom, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, topic, isPrivate, password } = req.body;

    // Check if room name is reserved
    if (name.toLowerCase() === 'public-lobby') {
        return res.status(400).json({ error: 'This room name is reserved' });
    }

    const room = new Room({
        name: name.toLowerCase(),
        topic: topic || '',
        isPrivate: isPrivate || false,
        password,
        creator: req.user._id,
        members: [req.user._id],
        admins: [req.user._id],
        memberCount: 1,
        lastActivity: new Date()
    });

    await room.save();
    res.status(201).json({ room });
}));

// Get a specific room
router.get('/:id', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id)
        .populate('members', 'username avatarUrl')
        .populate('admins', 'username avatarUrl')
        .populate('creator', 'username avatarUrl');

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ room });
}));

// Update a room
router.put('/:id', auth, validateRoom, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.admins.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to update room' });
    }

    const { name, topic, isPrivate, password } = req.body;

    if (name) room.name = name;
    if (topic) room.topic = topic;
    if (typeof isPrivate !== 'undefined') room.isPrivate = isPrivate;
    if (password) room.password = password;

    await room.save();
    res.json({ room });
}));

// Delete a room
router.delete('/:id', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.admins.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to delete room' });
    }

    await room.remove();
    res.json({ message: 'Room deleted successfully' });
}));

module.exports = router;