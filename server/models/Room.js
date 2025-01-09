const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    notificationSettings: {
        mentions: {
            type: Boolean,
            default: true
        },
        messages: {
            type: Boolean,
            default: true
        },
        reactions: {
            type: Boolean,
            default: true
        }
    }
});

const invitationSchema = new mongoose.Schema({
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    expiresAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const pinnedMessageSchema = new mongoose.Schema({
    message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        required: true
    },
    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pinnedAt: {
        type: Date,
        default: Date.now
    }
});

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['public', 'private', 'direct'],
        default: 'public'
    },
    avatar: {
        url: String,
        color: String
    },
    categories: [{
        type: String,
        trim: true
    }],
    tags: [{
        type: String,
        trim: true
    }],
    members: [memberSchema],
    invitations: [invitationSchema],
    pinnedMessages: [pinnedMessageSchema],
    settings: {
        allowInvites: {
            type: Boolean,
            default: true
        },
        allowFileSharing: {
            type: Boolean,
            default: true
        },
        maxFileSize: {
            type: Number,
            default: 10 * 1024 * 1024 // 10MB
        },
        allowedFileTypes: [{
            type: String,
            default: ['image/*', 'application/pdf']
        }],
        requireApproval: {
            type: Boolean,
            default: false
        },
        readOnly: {
            type: Boolean,
            default: false
        },
        slowMode: {
            enabled: {
                type: Boolean,
                default: false
            },
            delay: {
                type: Number,
                default: 0
            }
        }
    },
    metadata: {
        messageCount: {
            type: Number,
            default: 0
        },
        lastActivity: Date,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }
}, {
    timestamps: true
});

// Indexes for faster queries
roomSchema.index({ name: 'text', description: 'text' });
roomSchema.index({ categories: 1 });
roomSchema.index({ tags: 1 });
roomSchema.index({ 'members.user': 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ 'invitations.invitedUser': 1 });

const Room = mongoose.model('Room', roomSchema);
module.exports = Room; 