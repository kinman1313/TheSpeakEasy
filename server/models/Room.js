const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    topic: {
        type: String,
        trim: true,
        default: ''
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        default: null
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    memberCount: {
        type: Number,
        default: 0
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastActivity when messages are sent
roomSchema.methods.updateActivity = async function () {
    this.lastActivity = new Date();
    await this.save();
};

// Add member to room
roomSchema.methods.addMember = async function (userId) {
    if (!this.members.includes(userId)) {
        this.members.push(userId);
        this.memberCount = this.members.length;
        await this.save();
    }
};

// Remove member from room
roomSchema.methods.removeMember = async function (userId) {
    this.members = this.members.filter(id => !id.equals(userId));
    this.memberCount = this.members.length;
    await this.save();
};

// Add admin to room
roomSchema.methods.addAdmin = async function (userId) {
    if (!this.admins.includes(userId)) {
        this.admins.push(userId);
        await this.save();
    }
};

// Remove admin from room
roomSchema.methods.removeAdmin = async function (userId) {
    this.admins = this.admins.filter(id => !id.equals(userId));
    await this.save();
};

// Check if user is admin
roomSchema.methods.isAdmin = function (userId) {
    return this.admins.some(id => id.equals(userId));
};

// Check if user is member
roomSchema.methods.isMember = function (userId) {
    return this.members.some(id => id.equals(userId));
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room; 