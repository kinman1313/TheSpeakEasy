const helmet = require('helmet');
const cors = require('cors');

const securityMiddleware = (app) => {
    // CORS configuration
    app.use(cors({
        origin: process.env.CLIENT_URL || 'https://lies-client-9ayj.onrender.com',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Helmet configuration
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: [
                    "'self'",
                    process.env.CLIENT_URL || 'https://lies-client-9ayj.onrender.com',
                    'wss://lies-server-9ayj.onrender.com',
                    'ws://lies-server-9ayj.onrender.com'
                ],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'",
                    'https://lies-client-9ayj.onrender.com'
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