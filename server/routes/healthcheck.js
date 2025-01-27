const router = require('express').Router();

router.get('/api/healthcheck', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        websockets: req.io.engine.clientsCount
    });
});

module.exports = router;