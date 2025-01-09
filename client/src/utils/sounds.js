// Message notification sounds
const messageDefault = new Audio('/sounds/message-default.mp3');
const messageSubtle = new Audio('/sounds/message-subtle.mp3');

// Notification sounds
const notificationDefault = new Audio('/sounds/notification-default.mp3');
const notificationSubtle = new Audio('/sounds/notification-subtle.mp3');

// Room join/leave sounds
const roomJoin = new Audio('/sounds/room-join.mp3');
const roomLeave = new Audio('/sounds/room-leave.mp3');

// Preload all sounds
[messageDefault, messageSubtle, notificationDefault, notificationSubtle, roomJoin, roomLeave].forEach(sound => {
    sound.load();
    sound.volume = 0.5;
});

export const playSound = (type, variant = 'default') => {
    let sound;
    switch (type) {
        case 'message':
            sound = variant === 'default' ? messageDefault : messageSubtle;
            break;
        case 'notification':
            sound = variant === 'default' ? notificationDefault : notificationSubtle;
            break;
        case 'roomJoin':
            sound = roomJoin;
            break;
        case 'roomLeave':
            sound = roomLeave;
            break;
        default:
            return;
    }

    if (sound.paused) {
        sound.currentTime = 0;
        sound.play().catch(err => console.log('Sound play failed:', err));
    }
}; 