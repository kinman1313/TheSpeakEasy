import { Howl } from 'howler';

// Sound files mapping
const sounds = {
    message: {
        default: '/sounds/message-default.mp3',
        subtle: '/sounds/message-subtle.mp3',
        none: null
    },
    mention: {
        default: '/sounds/mention-default.mp3',
        subtle: '/sounds/mention-subtle.mp3',
        none: null
    },
    joinLeave: {
        default: '/sounds/join-leave-default.mp3',
        subtle: '/sounds/join-leave-subtle.mp3',
        none: null
    }
};

export const playSound = (type, variant = 'default', volume = 0.5) => {
    const soundFile = sounds[type]?.[variant];

    if (!soundFile) {
        console.log('No sound file found for:', { type, variant });
        return;
    }

    const sound = new Howl({
        src: [soundFile],
        volume
    });

    sound.play();
};