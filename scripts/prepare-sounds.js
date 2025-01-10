const fs = require('fs');
const path = require('path');
const https = require('https');

const SOUNDS_DIR = path.join(__dirname, '../client/public/sounds');

// Create sounds directory if it doesn't exist
if (!fs.existsSync(SOUNDS_DIR)) {
    fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

const sounds = {
    'message-default': 'https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3',
    'message-subtle': 'https://notificationsounds.com/storage/sounds/file-sounds-1146-quite-impressed.mp3',
    'notification-default': 'https://notificationsounds.com/storage/sounds/file-sounds-1149-piece-of-cake.mp3',
    'notification-subtle': 'https://notificationsounds.com/storage/sounds/file-sounds-1147-quick-notice.mp3',
    'room-join': 'https://notificationsounds.com/storage/sounds/file-sounds-1144-positive-notification.mp3',
    'room-leave': 'https://notificationsounds.com/storage/sounds/file-sounds-1145-pristine.mp3'
};

const downloadSound = (url, filename) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(SOUNDS_DIR, `${filename}.mp3`);
        const file = fs.createWriteStream(filePath);

        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${filename}.mp3`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {
                reject(err);
            });
        });
    });
};

const downloadAllSounds = async () => {
    try {
        console.log('Downloading notification sounds...');
        await Promise.all(
            Object.entries(sounds).map(([name, url]) => downloadSound(url, name))
        );
        console.log('All sounds downloaded successfully!');
    } catch (error) {
        console.error('Error downloading sounds:', error);
        process.exit(1);
    }
};

downloadAllSounds(); 