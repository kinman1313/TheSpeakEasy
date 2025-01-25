const path = require('path');

const config = {
    // Use Render's persistent disk path when available
    UPLOAD_DIR: process.env.RENDER_DISK_PATH
        ? path.resolve(process.env.RENDER_DISK_PATH)
        : path.join(__dirname, 'uploads'),

    // Specific upload directories as getters
    get AVATAR_DIR() {
        return path.join(this.UPLOAD_DIR, 'avatars');
    },
    get VOICE_MESSAGE_DIR() {
        return path.join(this.UPLOAD_DIR, 'voice-messages');
    },

    // URLs for accessing uploads (keep these the same)
    get AVATAR_URL_PATH() {
        return '/uploads/avatars';
    },
    get VOICE_MESSAGE_URL_PATH() {
        return '/uploads/voice-messages';
    },

    // File size limits (keep these the same)
    MAX_AVATAR_SIZE: 5 * 1024 * 1024,  // 5MB
    MAX_VOICE_MESSAGE_SIZE: 10 * 1024 * 1024,  // 10MB

    // Allowed file types (keep these the same)
    ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_VOICE_TYPES: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
};

// Modified validation to check actual directory existence in production
if (process.env.NODE_ENV === 'production') {
    if (!process.env.RENDER_DISK_PATH) {
        throw new Error('RENDER_DISK_PATH environment variable is required in production');
    }

    // Add path safety check
    if (!config.UPLOAD_DIR.startsWith('/opt/render/project')) {
        throw new Error('Production uploads must use Render persistent disk path');
    }
}

module.exports = config;