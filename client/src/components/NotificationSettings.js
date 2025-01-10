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
    IconButton,
    Button
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    VolumeUp as VolumeUpIcon,
    DoNotDisturb as DoNotDisturbIcon,
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
                            onChange={(e) => updateSettings({ enabled: e.target.checked })}
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
                            onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
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
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Message Sound</InputLabel>
                    <Select
                        value={settings.messageSound}
                        label="Message Sound"
                        onChange={(e) => updateSettings({ messageSound: e.target.value })}
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
                                            handleSoundPreview('message');
                                        }}
                                        sx={{ ml: 1 }}
                                    >
                                        <PlayArrowIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Mention Sound</InputLabel>
                    <Select
                        value={settings.mentionSound}
                        label="Mention Sound"
                        onChange={(e) => updateSettings({ mentionSound: e.target.value })}
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
                                            handleSoundPreview('mention');
                                        }}
                                        sx={{ ml: 1 }}
                                    >
                                        <PlayArrowIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel>Join/Leave Sound</InputLabel>
                    <Select
                        value={settings.joinLeaveSound}
                        label="Join/Leave Sound"
                        onChange={(e) => updateSettings({ joinLeaveSound: e.target.value })}
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
                                            handleSoundPreview('joinLeave');
                                        }}
                                        sx={{ ml: 1 }}
                                    >
                                        <PlayArrowIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.desktopNotifications}
                            onChange={(e) => updateSettings({ desktopNotifications: e.target.checked })}
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
                            onChange={(e) => updateSettings({ mentionsOnly: e.target.checked })}
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
                            onChange={(e) => updateSettings({ doNotDisturb: e.target.checked })}
                        />
                    }
                    label="Do Not Disturb"
                />
            </Box>
        </Paper>
    );
};

export default NotificationSettings; 