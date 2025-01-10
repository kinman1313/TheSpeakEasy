const socket = io(process.env.REACT_APP_API_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    extraHeaders: {
        'Access-Control-Allow-Origin': window.location.origin
    },
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000
}); 