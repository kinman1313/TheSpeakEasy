const helmet = require('helmet');
const cors = require('cors');

const CLIENT_URL = process.env.CLIENT_URL || 'https://lies-client-9ayj.onrender.com';
const SERVER_URL = process.env.SERVER_URL || 'https://lies-server-9ayj.onrender.com';

const securityMiddleware = (app) => {
    // CORS configuration
    app.use(cors({
        origin: CLIENT_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        maxAge: 600 // Increase preflight cache time to 10 minutes
    }));

    // Helmet configuration
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: [
                    "'self'",
                    CLIENT_URL,
                    SERVER_URL,
                    SERVER_URL.replace('https', 'wss'),
                    SERVER_URL.replace('https', 'ws')
                ],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'",
                    CLIENT_URL
                ],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:", "*"],
                mediaSrc: ["'self'", "data:", "blob:", "*"],
                fontSrc: ["'self'", "data:", "*"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
                workerSrc: ["'self'", "blob:"],
                frameSrc: ["'self'"],
                formAction: ["'self'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
};

module.exports = securityMiddleware; 