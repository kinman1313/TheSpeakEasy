const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const config = {
    API_URL,
    SOCKET_URL: API_URL
}; 