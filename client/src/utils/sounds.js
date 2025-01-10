// Import sound files
import messageDefaultSound from '../assets/sounds/message-default.mp3';
import messageSubtleSound from '../assets/sounds/message-subtle.mp3';
import notificationDefaultSound from '../assets/sounds/notification-default.mp3';
import notificationSubtleSound from '../assets/sounds/notification-subtle.mp3';
import roomJoinSound from '../assets/sounds/room-join.mp3';
import roomLeaveSound from '../assets/sounds/room-leave.mp3';

// Create audio instances
const messageDefault = new Audio(messageDefaultSound);
const messageSubtle = new Audio(messageSubtleSound);
const notificationDefault = new Audio(notificationDefaultSound);
const notificationSubtle = new Audio(notificationSubtleSound);
const roomJoin = new Audio(roomJoinSound);
const roomLeave = new Audio(roomLeaveSound);

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