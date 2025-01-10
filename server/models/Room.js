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
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [memberSchema],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    pinnedMessages: [{
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        pinnedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        pinnedAt: {
            type: Date,
            default: Date.now
        }
    }],
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
        lastActivity: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for faster queries
roomSchema.index({ name: 'text', description: 'text' });
roomSchema.index({ participants: 1 });
roomSchema.index({ type: 1 });
roomSchema.index({ 'members.user': 1 });
roomSchema.index({ createdBy: 1 });

// Pre-save middleware to update lastActivity
roomSchema.pre('save', function (next) {
    if (this.isModified('lastMessage')) {
        this.metadata.lastActivity = new Date();
    }
    next();
});

// Method to check if a user is a member
roomSchema.methods.isMember = function (userId) {
    return this.members.some(member => member.user.toString() === userId.toString());
};

// Method to check if a user has a specific role
roomSchema.methods.hasRole = function (userId, role) {
    const member = this.members.find(m => m.user.toString() === userId.toString());
    return member && member.role === role;
};

// Method to add a member
roomSchema.methods.addMember = async function (userId, role = 'member') {
    if (!this.isMember(userId)) {
        this.members.push({
            user: userId,
            role: role
        });
        await this.save();
    }
    return this;
};

// Method to remove a member
roomSchema.methods.removeMember = async function (userId) {
    this.members = this.members.filter(member => member.user.toString() !== userId.toString());
    await this.save();
    return this;
};

// Method to update member role
roomSchema.methods.updateMemberRole = async function (userId, newRole) {
    const member = this.members.find(m => m.user.toString() === userId.toString());
    if (member) {
        member.role = newRole;
        await this.save();
    }
    return this;
};

module.exports = mongoose.model('Room', roomSchema); 