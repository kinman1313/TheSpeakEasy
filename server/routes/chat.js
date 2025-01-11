const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');

// Create a new room
router.post('/rooms', auth, async (req, res) => {
    try {
        const { name, topic, isPrivate, password } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Room name is required' });
        }

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
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create room',
            message: error.message
        });
    }
});

// Get all public rooms
router.get('/rooms', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ isPrivate: false })
            .select('name topic memberCount lastActivity')
            .sort('-lastActivity');

        res.json({ rooms });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// Join a room
router.post('/rooms/:roomId/join', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ error: 'Failed to join room' });
    }
});

// Leave a room
router.post('/rooms/:roomId/leave', auth, async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        room.members = room.members.filter(id => !id.equals(req.user._id));
        room.memberCount = room.members.length;
        await room.save();

        res.json({ message: 'Successfully left the room' });
    } catch (error) {
        console.error('Error leaving room:', error);
        res.status(500).json({ error: 'Failed to leave room' });
    }
});

// Update room topic
router.patch('/rooms/:roomId/topic', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error updating room topic:', error);
        res.status(500).json({ error: 'Failed to update room topic' });
    }
});

// Get room messages
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Get room details
router.get('/rooms/:roomId', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error fetching room details:', error);
        res.status(500).json({ error: 'Failed to fetch room details' });
    }
});

// Add member to room
router.post('/rooms/:roomId/members', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Remove member from room
router.delete('/rooms/:roomId/members/:userId', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Add admin to room
router.post('/rooms/:roomId/admins', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({ error: 'Failed to add admin' });
    }
});

// Remove admin from room
router.delete('/rooms/:roomId/admins/:userId', auth, async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error removing admin:', error);
        res.status(500).json({ error: 'Failed to remove admin' });
    }
});

module.exports = router; 