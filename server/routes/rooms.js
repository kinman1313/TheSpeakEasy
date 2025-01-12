const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// Get all rooms
router.get('/', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// Create a new room
router.post('/', auth, async (req, res) => {
    try {
        const { name, topic, isPrivate, password } = req.body;

        // Validate room name
        if (!name) {
            return res.status(400).json({ error: 'Room name is required' });
        }

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
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Get a specific room
router.get('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('members', 'username avatarUrl')
            .populate('admins', 'username avatarUrl')
            .populate('creator', 'username avatarUrl');

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        res.json({ room });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ error: 'Failed to fetch room' });
    }
});

// Update a room
router.put('/:id', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ error: 'Failed to update room' });
    }
});

// Delete a room
router.delete('/:id', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        if (!room.admins.includes(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized to delete room' });
        }

        await room.remove();
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

module.exports = router; 