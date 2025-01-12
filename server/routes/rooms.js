const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// Get all rooms
router.get('/', auth, async (req, res) => {
    try {
        const rooms = await Room.find()
            .sort('-lastActivity')
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

        const room = new Room({
            name,
            topic,
            isPrivate: isPrivate || false,
            password,
            creator: req.user._id,
            members: [req.user._id],
            admins: [req.user._id]
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
        const room = await Room.findById(req.params.id);
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