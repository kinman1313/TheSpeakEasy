import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { playSound } from '../utils/sounds';

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

    const handleNotification = (type, data) => {
        if (!settings.enabled || settings.doNotDisturb) return;
        if (settings.mentionsOnly && !data.isMention) return;

        // Play sound notification
        if (settings.soundEnabled) {
            const soundType = type === 'mention' ? 'mention' :
                type === 'message' ? 'message' :
                    type === 'join' ? 'roomJoin' :
                        type === 'leave' ? 'roomLeave' : 'notification';

            const variant = settings[`${soundType}Sound`] || 'default';
            playSound(soundType, variant);
        }

        // Show desktop notification if enabled
        if (settings.desktopNotifications && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(data.title, {
                    body: data.message,
                    icon: data.icon || '/logo192.png'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(data.title, {
                            body: data.message,
                            icon: data.icon || '/logo192.png'
                        });
                    }
                });
            }
        }
    };

    const value = {
        settings,
        updateSettings,
        notify: handleNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext; 