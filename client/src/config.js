const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
    API_URL: isDevelopment ? 'http://localhost:5000' : 'https://lies-server-9ayj.onrender.com',
    SOCKET_OPTIONS: {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        forceNew: true
    },
    DEFAULT_AVATAR: 'https://via.placeholder.com/150',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'audio/webm'],
    MAX_MESSAGE_LENGTH: 1000,
    TYPING_TIMEOUT: 3000,
    MESSAGE_FETCH_LIMIT: 50,
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 3000
};

export { config }; 