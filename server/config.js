const path = require('path');

const config = {
    // Base upload directory - use Render's persistent disk in production
    UPLOAD_DIR: process.env.NODE_ENV === 'production'
        ? '/opt/render/project/uploads'  // Updated Render's persistent disk path
        : path.join(__dirname, 'uploads'),

    // Specific upload directories
    get AVATAR_DIR() {
        return path.join(this.UPLOAD_DIR, 'avatars');
    },
    get VOICE_MESSAGE_DIR() {
        return path.join(this.UPLOAD_DIR, 'voice-messages');
    },

    // URLs for accessing uploads
    get AVATAR_URL_PATH() {
        return '/uploads/avatars';
    },
    get VOICE_MESSAGE_URL_PATH() {
        return '/uploads/voice-messages';
    },

    // File size limits
    MAX_AVATAR_SIZE: 5 * 1024 * 1024,  // 5MB
    MAX_VOICE_MESSAGE_SIZE: 10 * 1024 * 1024,  // 10MB

    // Allowed file types
    ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_VOICE_TYPES: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
};

module.exports = config; 