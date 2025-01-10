const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

const handleMessage = async (io, socket, data) => {
    try {
        const { type, content, metadata, roomId, replyTo } = data;

        const message = new Message({
            type,
            content,
            metadata,
            roomId,
            username: socket.username,
            replyTo,
            reactions: []
        });
        await message.save();

        // Update room's lastMessage
        await Room.findByIdAndUpdate(roomId, {
            lastMessage: message._id
        });

        // Emit to room
        io.to(roomId).emit('message', {
            ...message.toObject(),
            createdAt: message.createdAt,
            username: socket.username
        });

    } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
    }
};

const handlePinMessage = async (io, socket, data) => {
    try {
        const { messageId, roomId } = data;
        const message = await Message.findById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        message.isPinned = true;
        message.pinnedBy = socket.username;
        message.pinnedAt = new Date();
        await message.save();

        await Room.findByIdAndUpdate(roomId, {
            $push: {
                pinnedMessages: {
                    messageId: message._id,
                    pinnedBy: socket.userId,
                    pinnedAt: new Date()
                }
            }
        });

        io.to(roomId).emit('messagePinned', {
            messageId,
            pinnedBy: socket.username,
            pinnedAt: message.pinnedAt
        });

    } catch (error) {
        console.error('Error pinning message:', error);
        socket.emit('error', { message: 'Failed to pin message' });
    }
};

const handleCreateDM = async (io, socket, data) => {
    try {
        const { targetUsername } = data;
        const targetUser = await User.findOne({ username: targetUsername });

        if (!targetUser) {
            throw new Error('User not found');
        }

        // Check if DM room already exists
        let room = await Room.findOne({
            type: 'direct',
            participants: {
                $all: [socket.userId, targetUser._id],
                $size: 2
            }
        });

        if (!room) {
            room = new Room({
                name: `DM: ${socket.username} & ${targetUsername}`,
                type: 'direct',
                participants: [socket.userId, targetUser._id],
                createdBy: socket.userId
            });
            await room.save();
        }

        // Join both users to the room
        socket.join(room._id.toString());
        const targetSocket = io.sockets.sockets.get(targetUser.socketId);
        if (targetSocket) {
            targetSocket.join(room._id.toString());
        }

        socket.emit('dmCreated', {
            roomId: room._id,
            participant: {
                username: targetUsername,
                id: targetUser._id
            }
        });

    } catch (error) {
        console.error('Error creating DM:', error);
        socket.emit('error', { message: 'Failed to create DM' });
    }
};

const handleGetHistory = async (socket, data) => {
    try {
        const { roomId, limit = 50, before } = data;
        const query = { roomId };

        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('replyTo')
            .lean();

        socket.emit('messageHistory', {
            messages: messages.reverse(),
            roomId
        });

    } catch (error) {
        console.error('Error fetching history:', error);
        socket.emit('error', { message: 'Failed to fetch message history' });
    }
};

const handleTyping = async (io, socket, data) => {
    try {
        const { roomId, isTyping } = data;
        // Emit typing status to room
        socket.to(roomId).emit('typing', {
            username: socket.username,
            isTyping,
            roomId
        });
    } catch (error) {
        console.error('Error handling typing:', error);
    }
};

const handleReaction = async (io, socket, data) => {
    try {
        const { messageId, emoji } = data;
        const message = await Message.findById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        // Add reaction if not already added by this user
        const existingReaction = message.reactions.find(
            r => r.username === socket.username && r.emoji === emoji
        );

        if (!existingReaction) {
            message.reactions.push({
                emoji,
                username: socket.username
            });
            await message.save();

            io.to(message.roomId).emit('reaction', {
                messageId,
                emoji,
                username: socket.username
            });
        }
    } catch (error) {
        console.error('Error handling reaction:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
    }
};

const handleRemoveReaction = async (io, socket, data) => {
    try {
        const { messageId, emoji } = data;
        const message = await Message.findById(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        // Remove reaction
        message.reactions = message.reactions.filter(
            r => !(r.username === socket.username && r.emoji === emoji)
        );
        await message.save();

        io.to(message.roomId).emit('removeReaction', {
            messageId,
            emoji,
            username: socket.username
        });
    } catch (error) {
        console.error('Error removing reaction:', error);
        socket.emit('error', { message: 'Failed to remove reaction' });
    }
};

module.exports = {
    handleMessage,
    handlePinMessage,
    handleCreateDM,
    handleGetHistory,
    handleTyping,
    handleReaction,
    handleRemoveReaction
}; 