const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    emoji: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    }
});

const messageSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['text', 'image', 'gif', 'voice', 'system']
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        type: Object,
        default: {}
    },
    roomId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    pinnedBy: {
        type: String,
        sparse: true
    },
    pinnedAt: {
        type: Date,
        sparse: true
    },
    reactions: [reactionSchema],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        sparse: true
    }
}, {
    timestamps: true
});

messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ isPinned: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
