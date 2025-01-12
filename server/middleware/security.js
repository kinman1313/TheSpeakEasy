const helmet = require('helmet');

const securityMiddleware = (app) => {
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    connectSrc: ["'self'", "wss:", "ws:", "https:", "http:"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
                    imgSrc: ["'self'", "data:", "https:", "http:"],
                    fontSrc: ["'self'", "data:", "https:", "http:"],
                    mediaSrc: ["'self'", "data:", "https:", "http:"],
                    objectSrc: ["'none'"],
                    frameSrc: ["'self'"],
                    workerSrc: ["'self'", "blob:"],
                    childSrc: ["'self'", "blob:"],
                    upgradeInsecureRequests: []
                }
            },
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: { policy: "cross-origin" },
            crossOriginOpenerPolicy: false
        })
    );

    // CORS middleware
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        next();
    });
};

module.exports = securityMiddleware; 