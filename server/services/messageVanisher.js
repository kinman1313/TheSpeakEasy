const Message = require('../models/Message');

class MessageVanisher {
    constructor(io) {
        this.io = io;
        this.vanishingMessages = new Map();
        this.checkInterval = setInterval(() => this.checkVanishingMessages(), 1000);
    }

    /**
     * Adds a message to the vanishing queue.
     * @param {Object} message - The message object.
     * @param {number} vanishTime - The time in minutes after which the message should vanish.
     * @returns {Object} - The message ID and expiry time.
     */
    addVanishingMessage(message, vanishTime) {
        if (vanishTime <= 0) {
            throw new Error('Vanish time must be greater than zero');
        }

        const expiryTime = Date.now() + (vanishTime * 60 * 1000); // Convert minutes to milliseconds
        const timeoutId = setTimeout(async () => {
            try {
                // Delete the message from database
                await Message.findByIdAndDelete(message._id);

                // Notify room about message deletion
                this.io.to(message.room).emit('message_deleted', {
                    messageId: message._id,
                    reason: 'vanished'
                });

                // Remove from tracking
                this.vanishingMessages.delete(message._id);
            } catch (error) {
                console.error('Error deleting vanishing message:', error);
            }
        }, vanishTime * 60 * 1000);

        // Store message expiry info
        this.vanishingMessages.set(message._id.toString(), {
            messageId: message._id,
            roomId: message.room,
            expiryTime,
            timeoutId
        });

        return {
            messageId: message._id,
            expiryTime
        };
    }

    /**
     * Cancels a vanishing message.
     * @param {string} messageId - The ID of the message to cancel vanishing.
     * @returns {boolean} - True if the message was found and cancelled, false otherwise.
     */
    cancelVanishing(messageId) {
        const vanishing = this.vanishingMessages.get(messageId);
        if (vanishing) {
            clearTimeout(vanishing.timeoutId);
            this.vanishingMessages.delete(messageId);
            return true;
        }
        return false;
    }

    /**
     * Gets information about a vanishing message.
     * @param {string} messageId - The ID of the message.
     * @returns {Object|null} - The message ID and remaining time in seconds, or null if not found.
     */
    getVanishingInfo(messageId) {
        const vanishing = this.vanishingMessages.get(messageId);
        if (vanishing) {
            const remainingTime = Math.max(0, vanishing.expiryTime - Date.now());
            return {
                messageId,
                remainingTime: Math.ceil(remainingTime / 1000) // Convert to seconds
            };
        }
        return null;
    }

    /**
     * Checks and cleans up expired vanishing messages.
     */
    checkVanishingMessages() {
        const now = Date.now();
        for (const [messageId, info] of this.vanishingMessages) {
            if (info.expiryTime <= now) {
                clearTimeout(info.timeoutId);
                this.vanishingMessages.delete(messageId);
            }
        }
    }

    /**
     * Cleans up resources and stops the interval check.
     */
    cleanup() {
        clearInterval(this.checkInterval);
        for (const { timeoutId } of this.vanishingMessages.values()) {
            clearTimeout(timeoutId);
        }
        this.vanishingMessages.clear();
    }
}

module.exports = MessageVanisher;