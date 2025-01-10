const path = require('path');

module.exports = function override(config, env) {
    // Add MP3 file handling
    config.module.rules.push({
        test: /\.(mp3)$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    name: '[name].[hash:8].[ext]',
                    outputPath: 'static/media',
                },
            },
        ],
    });

    return config;
}; 