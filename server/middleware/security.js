const helmet = require('helmet');
const cors = require('cors');

const CLIENT_URL = process.env.CLIENT_URL || 'https://lies-client-9ayj.onrender.com';
const SERVER_URL = process.env.SERVER_URL || 'https://lies-server-9ayj.onrender.com';

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            CLIENT_URL,
            'https://lies-client-9ayj.onrender.com',
            'http://localhost:3000'
        ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // Increase preflight cache time to 10 minutes
};

const securityMiddleware = (app) => {
    // CORS configuration
    app.use(cors(corsOptions));

    // Handle preflight requests
    app.options('*', cors(corsOptions));

    // Helmet configuration
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: [
                    "'self'",
                    CLIENT_URL,
                    SERVER_URL,
                    'wss://lies-server-9ayj.onrender.com',
                    'ws://lies-server-9ayj.onrender.com',
                    'http://localhost:3000',
                    'ws://localhost:3000'
                ],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'",
                    CLIENT_URL,
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