const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
    // API base URL (backend)
    API_URL: isDevelopment
        ? 'http://localhost:5000' // Development backend URL
        : 'https://lies-server-9ayj.onrender.com', // Production backend URL

    // Socket.IO connection options
    SOCKET_OPTIONS: {
        transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
        reconnection: true, // Enable reconnection
        reconnectionAttempts: 5, // Max reconnection attempts
        reconnectionDelay: 1000, // Initial delay between reconnections (ms)
        reconnectionDelayMax: 5000, // Max delay between reconnections (ms)
        timeout: 20000, // Connection timeout (ms)
        autoConnect: true, // Automatically connect on initialization
        forceNew: true, // Force new connection
        withCredentials: true, // Send credentials (cookies, auth headers)
        extraHeaders: {
            'Access-Control-Allow-Credentials': 'true', // Allow credentials in CORS
        },
    },

    // Default avatar URL for users
    DEFAULT_AVATAR: 'https://via.placeholder.com/150',

    // File upload settings
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'audio/webm'],

    // Message settings
    MAX_MESSAGE_LENGTH: 1000, // Max characters per message
    TYPING_TIMEOUT: 3000, // Timeout for typing indicator (ms)
    MESSAGE_FETCH_LIMIT: 50, // Number of messages to fetch at once

    // Reconnection settings
    RECONNECT_ATTEMPTS: 5, // Max reconnection attempts
    RECONNECT_DELAY: 3000, // Delay between reconnection attempts (ms)

    // Client URL (frontend)
    CLIENT_URL: isDevelopment
        ? 'http://localhost:3000' // Development frontend URL
        : 'https://lies-client-9ayj.onrender.com', // Production frontend URL
};

export { config };