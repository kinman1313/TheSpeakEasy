import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        enabled: true,
        soundEnabled: true,
        messageSound: 'default', // 'default', 'subtle', 'none'
        mentionSound: 'default',
        joinLeaveSound: 'default',
        volume: 0.5,
        desktopNotifications: true,
        mentionsOnly: false,
        doNotDisturb: false,
    });

    // Load settings from user preferences
    useEffect(() => {
        if (user?.preferences?.notifications) {
            setSettings(prev => ({
                ...prev,
                ...user.preferences.notifications
            }));
        }
    }, [user]);

    const updateSettings = async (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
        // Here you would typically save to the backend
        // await updateUserPreferences({ notifications: newSettings });
    };

    const playSound = (type) => {
        if (!settings.soundEnabled || settings.doNotDisturb) return;

        const soundMap = {
            message: settings.messageSound,
            mention: settings.mentionSound,
            joinLeave: settings.joinLeaveSound
        };

        const variant = soundMap[type] || 'default';
        if (variant === 'none') return;

        const sound = new Audio(`/sounds/${type}-${variant}.mp3`);
        sound.volume = settings.volume;
        sound.play().catch(err => console.log('Sound play failed:', err));
    };

    const value = {
        settings,
        updateSettings,
        playSound
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext; 