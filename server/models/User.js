const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const profileSchema = new mongoose.Schema({
    displayName: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true,
        maxLength: 500
    },
    avatar: {
        url: String,
        color: String
    },
    status: {
        text: {
            type: String,
            trim: true,
            maxLength: 100
        },
        emoji: String,
        expiresAt: Date
    },
    links: [{
        platform: {
            type: String,
            enum: ['github', 'twitter', 'linkedin', 'website'],
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    timezone: String,
    language: {
        type: String,
        default: 'en'
    }
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 3,
        maxLength: 30,
        validate: {
            validator: function (v) {
                return /^[a-zA-Z0-9_-]+$/.test(v);
            },
            message: 'Username can only contain letters, numbers, underscores, and hyphens'
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: 'Invalid email format'
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 8
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    profile: profileSchema,
    friends: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'blocked'],
            default: 'pending'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        },
        messageColor: {
            type: String,
            default: '#7C4DFF'
        },
        bubbleStyle: {
            type: String,
            enum: ['modern', 'classic', 'minimal'],
            default: 'modern'
        },
        notifications: {
            sound: {
                type: Boolean,
                default: true
            },
            desktop: {
                type: Boolean,
                default: true
            },
            email: {
                type: Boolean,
                default: false
            }
        },
        privacy: {
            showOnlineStatus: {
                type: Boolean,
                default: true
            },
            allowFriendRequests: {
                type: Boolean,
                default: true
            },
            allowMentions: {
                type: String,
                enum: ['everyone', 'friends', 'none'],
                default: 'everyone'
            }
        }
    },
    lastSeen: Date,
    isOnline: {
        type: Boolean,
        default: false
    },
    tokens: [{
        token: {
            type: String,
            required: true
        },
        device: String,
        lastUsed: Date
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

// Method to check password
userSchema.methods.checkPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

// Method to generate auth token
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

// Add indexes for faster searches
userSchema.index({ username: 'text', 'profile.displayName': 'text' });
userSchema.index({ email: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ 'friends.user': 1, 'friends.status': 1 });

// Find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid login credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid login credentials');
    }
    return user;
};

const User = mongoose.model('User', userSchema);
module.exports = User; 