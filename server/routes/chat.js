const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');
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

// Create a new room
router.post('/rooms', auth, validateRoom, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, topic, isPrivate, password } = req.body;

    // Check if room name already exists
    const existingRoom = await Room.findOne({ name: name.toLowerCase() });
    if (existingRoom) {
        return res.status(400).json({ error: 'Room name already exists' });
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

    return res.status(201).json({
        success: true,
        room: {
            id: room._id,
            name: room.name,
            topic: room.topic,
            isPrivate: room.isPrivate,
            memberCount: room.memberCount,
            members: [req.user._id],
            admins: [req.user._id],
            creator: req.user._id
        }
    });
}));

// Get all public rooms
router.get('/rooms', auth, asyncHandler(async (req, res) => {
    const rooms = await Room.find({ isPrivate: false })
        .select('name topic memberCount lastActivity')
        .sort('-lastActivity');

    res.json({ rooms });
}));

// Join a room
router.post('/rooms/:roomId/join', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (room.isPrivate) {
        const { password } = req.body;
        if (!password || password !== room.password) {
            return res.status(401).json({ error: 'Invalid room password' });
        }
    }

    if (!room.members.includes(req.user._id)) {
        room.members.push(req.user._id);
        room.memberCount = room.members.length;
        await room.save();
    }

    res.json({
        room: {
            id: room._id,
            name: room.name,
            topic: room.topic,
            isPrivate: room.isPrivate,
            memberCount: room.memberCount
        }
    });
}));

// Leave a room
router.post('/rooms/:roomId/leave', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    room.members = room.members.filter(id => !id.equals(req.user._id));
    room.memberCount = room.members.length;
    await room.save();

    res.json({ message: 'Successfully left the room' });
}));

// Update room topic
router.patch('/rooms/:roomId/topic', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.admins.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to update room topic' });
    }

    room.topic = req.body.topic;
    await room.save();

    res.json({
        room: {
            id: room._id,
            name: room.name,
            topic: room.topic,
            isPrivate: room.isPrivate,
            memberCount: room.memberCount
        }
    });
}));

// Get room messages
router.get('/rooms/:roomId/messages', auth, asyncHandler(async (req, res) => {
    const { before } = req.query;
    const limit = parseInt(req.query.limit) || 50;

    const room = await Room.findById(req.params.roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.members.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not a member of this room' });
    }

    const query = { room: room._id };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
        .sort('-createdAt')
        .limit(limit)
        .populate('sender', 'username avatarUrl');

    res.json({ messages: messages.reverse() });
}));

// Get room details
router.get('/rooms/:roomId', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.roomId)
        .populate('members', 'username avatarUrl')
        .populate('admins', 'username avatarUrl')
        .populate('creator', 'username avatarUrl');

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
        room: {
            id: room._id,
            name: room.name,
            topic: room.topic,
            isPrivate: room.isPrivate,
            memberCount: room.memberCount,
            members: room.members.map(member => ({
                id: member._id,
                username: member.username,
                avatarUrl: member.avatarUrl
            })),
            admins: room.admins.map(admin => admin._id),
            creator: room.creator._id
        }
    });
}));

// Add member to room
router.post('/rooms/:roomId/members', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.admins.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to add members' });
    }

    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    await room.addMember(userId);

    res.json({
        member: {
            id: user._id,
            username: user.username,
            avatarUrl: user.avatarUrl
        }
    });
}));

// Remove member from room
router.delete('/rooms/:roomId/members/:userId', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.admins.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to remove members' });
    }

    if (room.creator.equals(req.params.userId)) {
        return res.status(403).json({ error: 'Cannot remove room creator' });
    }

    await room.removeMember(req.params.userId);
    await room.removeAdmin(req.params.userId);

    res.json({ message: 'Member removed successfully' });
}));

// Add admin to room
router.post('/rooms/:roomId/admins', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.admins.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to add admins' });
    }

    const { userId } = req.body;
    if (!room.members.includes(userId)) {
        return res.status(400).json({ error: 'User must be a member first' });
    }

    await room.addAdmin(userId);

    res.json({ message: 'Admin added successfully' });
}));

// Remove admin from room
router.delete('/rooms/:roomId/admins/:userId', auth, asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.admins.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized to remove admins' });
    }

    if (room.creator.equals(req.params.userId)) {
        return res.status(403).json({ error: 'Cannot demote room creator' });
    }

    await room.removeAdmin(req.params.userId);

    res.json({ message: 'Admin removed successfully' });
}));

module.exports = router;
