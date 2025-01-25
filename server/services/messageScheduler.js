const Message = require('../models/Message');
const Room = require('../models/Room');

class MessageScheduler {
    constructor(io) {
        this.io = io;
        this.scheduledMessages = new Map();
        this.checkInterval = setInterval(() => this.checkScheduledMessages(), 1000);
    }

    /**
     * Schedules a message to be sent at a later time.
     * @param {Object} message - The message object containing content, roomId, userId, and scheduledTime.
     * @returns {string} - The ID of the scheduled message.
     */
    scheduleMessage(message) {
        const { content, roomId, userId, scheduledTime } = message;

        if (new Date(scheduledTime).getTime() <= Date.now()) {
            throw new Error('Scheduled time must be in the future');
        }

        const timeoutId = setTimeout(async () => {
            try {
                // Create and save the message
                const newMessage = new Message({
                    content,
                    room: roomId,
                    sender: userId,
                    type: 'text'
                });
                await newMessage.save();

                // Update room activity
                const room = await Room.findById(roomId);
                if (room) {
                    await room.updateActivity();
                }

                // Populate sender information
                await newMessage.populate('sender', 'username avatarUrl');

                // Emit to room
                this.io.to(roomId).emit('new_message', newMessage);

                // Remove from scheduled messages
                this.scheduledMessages.delete(message.id);
            } catch (error) {
                console.error('Error sending scheduled message:', error);
            }
        }, new Date(scheduledTime).getTime() - Date.now());

        // Store the message and its timeout
        this.scheduledMessages.set(message.id, {
            message,
            timeoutId
        });

        return message.id;
    }

    /**
     * Cancels a scheduled message.
     * @param {string} messageId - The ID of the message to cancel.
     * @returns {boolean} - True if the message was found and cancelled, false otherwise.
     */
    cancelScheduledMessage(messageId) {
        const scheduled = this.scheduledMessages.get(messageId);
        if (scheduled) {
            clearTimeout(scheduled.timeoutId);
            this.scheduledMessages.delete(messageId);
            return true;
        }
        return false;
    }

    /**
     * Gets all scheduled messages for a specific room and user.
     * @param {string} roomId - The ID of the room.
     * @param {string} userId - The ID of the user.
     * @returns {Array} - An array of scheduled messages.
     */
    getScheduledMessages(roomId, userId) {
        const messages = [];
        for (const [id, { message }] of this.scheduledMessages) {
            if (message.roomId === roomId && message.userId === userId) {
                messages.push({
                    id,
                    content: message.content,
                    scheduledTime: message.scheduledTime
                });
            }
        }
        return messages;
    }

    /**
     * Checks and cleans up expired scheduled messages.
     */
    checkScheduledMessages() {
        const now = Date.now();
        for (const [id, { message, timeoutId }] of this.scheduledMessages) {
            if (new Date(message.scheduledTime).getTime() <= now) {
                clearTimeout(timeoutId);
                this.scheduledMessages.delete(id);
            }
        }
    }

    /**
     * Cleans up resources and stops the interval check.
     */
    cleanup() {
        clearInterval(this.checkInterval);
        for (const { timeoutId } of this.scheduledMessages.values()) {
            clearTimeout(timeoutId);
        }
        this.scheduledMessages.clear();
    }
}

module.exports = MessageScheduler;