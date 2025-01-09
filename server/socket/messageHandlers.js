const Message = require('../models/Message');
const Room = require('../models/Room');

const handleMessage = async (io, socket, data) => {
    try {
        const { type, content, metadata, roomId } = data;

        const message = new Message({
            type,
            content,
            metadata,
            roomId,
            username: socket.username
        });

        await message.save();

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

const handleTyping = (io, socket, data) => {
    const { roomId, isTyping } = data;
    socket.to(roomId).emit('typing', {
        username: socket.username,
        isTyping
    });
};

module.exports = {
    handleMessage,
    handleTyping
}; 