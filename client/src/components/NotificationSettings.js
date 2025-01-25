import React from 'react';
import {
    Box,
    Typography,
    Switch,
    FormControlLabel,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Divider,
    IconButton
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    VolumeUp as VolumeUpIcon,
    PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationSettings = () => {
    const { settings, updateSettings, playSound } = useNotifications();

    const handleSoundPreview = (type) => {
        playSound(type);
    };

    const soundOptions = [
        { value: 'default', label: 'Default' },
        { value: 'subtle', label: 'Subtle' },
        { value: 'none', label: 'None' }
    ];

    const handleChange = (key) => (event) => {
        updateSettings({ [key]: event.target.checked });
    };

    const renderSoundSelect = (label, value, key) => (
        <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={value}
                label={label}
                onChange={(e) => updateSettings({ [key]: e.target.value })}
                disabled={!settings.soundEnabled}
            >
                {soundOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                        {option.value !== 'none' && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSoundPreview(key);
                                }}
                                sx={{ ml: 1 }}
                                aria-label={`Play ${label} sound`}
                            >
                                <PlayArrowIcon fontSize="small" />
                            </IconButton>
                        )}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    return (
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <NotificationsIcon sx={{ mr: 2 }} />
                <Typography variant="h6">Notification Settings</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.enabled}
                            onChange={handleChange('enabled')}
                        />
                    }
                    label="Enable Notifications"
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.soundEnabled}
                            onChange={handleChange('soundEnabled')}
                        />
                    }
                    label="Enable Sound Notifications"
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Volume</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <VolumeUpIcon />
                    <Slider
                        value={settings.volume}
                        onChange={(_, value) => updateSettings({ volume: value })}
                        min={0}
                        max={1}
                        step={0.1}
                        disabled={!settings.soundEnabled}
                    />
                </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
                {renderSoundSelect('Message Sound', settings.messageSound, 'messageSound')}
                {renderSoundSelect('Mention Sound', settings.mentionSound, 'mentionSound')}
                {renderSoundSelect('Join/Leave Sound', settings.joinLeaveSound, 'joinLeaveSound')}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.desktopNotifications}
                            onChange={handleChange('desktopNotifications')}
                        />
                    }
                    label="Desktop Notifications"
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.mentionsOnly}
                            onChange={handleChange('mentionsOnly')}
                        />
                    }
                    label="Only Notify on Mentions"
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.doNotDisturb}
                            onChange={handleChange('doNotDisturb')}
                        />
                    }
                    label="Do Not Disturb"
                />
            </Box>
        </Paper>
    );
};

export default NotificationSettings;
