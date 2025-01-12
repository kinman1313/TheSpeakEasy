const Message = require('../models/Message');

class MessageVanisher {
    constructor(io) {
        this.io = io;
        this.vanishingMessages = new Map();
        this.checkInterval = setInterval(() => this.checkVanishingMessages(), 1000);
    }

    addVanishingMessage(message, vanishTime) {
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

    cancelVanishing(messageId) {
        const vanishing = this.vanishingMessages.get(messageId);
        if (vanishing) {
            clearTimeout(vanishing.timeoutId);
            this.vanishingMessages.delete(messageId);
            return true;
        }
        return false;
    }

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

    checkVanishingMessages() {
        const now = Date.now();
        for (const [messageId, info] of this.vanishingMessages) {
            if (info.expiryTime <= now) {
                clearTimeout(info.timeoutId);
                this.vanishingMessages.delete(messageId);
            }
        }
    }

    cleanup() {
        clearInterval(this.checkInterval);
        for (const { timeoutId } of this.vanishingMessages.values()) {
            clearTimeout(timeoutId);
        }
        this.vanishingMessages.clear();
    }
}

module.exports = MessageVanisher; 