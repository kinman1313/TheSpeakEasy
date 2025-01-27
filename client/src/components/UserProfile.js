/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Avatar,
    Typography,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Tabs,
    Tab,
    Badge,
    Switch,
    FormControlLabel,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    GitHub as GitHubIcon,
    Twitter as TwitterIcon,
    LinkedIn as LinkedInIcon,
    Language as WebsiteIcon,
    AccessTime as TimeIcon,
    Translate as TranslateIcon,
    Palette as PaletteIcon,
    Notifications as NotificationsIcon,
    EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import NotificationSettings from './NotificationSettings';

const UserProfile = ({
    user,
    onUpdateProfile,
    onUpdatePreferences,
    onUpdateAvatar
}) => {
    const { user: currentUser } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [newAvatar, setNewAvatar] = useState(null);
    const [preferences, setPreferences] = useState({
        theme: user.preferences?.theme || 'light',
        language: user.preferences?.language || 'en',
        notifications: user.preferences?.notifications || true,
        messageColor: user.preferences?.messageColor || '#7C4DFF',
        bubbleStyle: user.preferences?.bubbleStyle || 'modern'
    });
    const [profile, setProfile] = useState({
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        github: user.profile?.github || '',
        twitter: user.profile?.twitter || '',
        linkedin: user.profile?.linkedin || '',
        website: user.profile?.website || ''
    });

    // Update local state when the `user` prop changes
    useEffect(() => {
        setPreferences({
            theme: user.preferences?.theme || 'light',
            language: user.preferences?.language || 'en',
            notifications: user.preferences?.notifications || true,
            messageColor: user.preferences?.messageColor || '#7C4DFF',
            bubbleStyle: user.preferences?.bubbleStyle || 'modern'
        });
        setProfile({
            bio: user.profile?.bio || '',
            location: user.profile?.location || '',
            github: user.profile?.github || '',
            twitter: user.profile?.twitter || '',
            linkedin: user.profile?.linkedin || '',
            website: user.profile?.website || ''
        });
    }, [user]);

    const handleSaveProfile = () => {
        onUpdateProfile(profile);
        setEditMode(false);
    };

    const handleSavePreferences = () => {
        onUpdatePreferences(preferences);
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAvatar = () => {
        if (newAvatar) {
            onUpdateAvatar(newAvatar);
            setAvatarDialogOpen(false);
            setNewAvatar(null);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: 'background.default'
                }}
            >
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                        <IconButton
                            size="small"
                            onClick={() => setAvatarDialogOpen(true)}
                            sx={{
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': { bgcolor: 'background.paper' }
                            }}
                            aria-label="edit avatar"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    <Avatar
                        src={user.profile?.avatar?.url}
                        sx={{ width: 100, height: 100, mb: 2 }}
                    >
                        {user.username ? user.username[0].toUpperCase() : '?'}
                    </Avatar>
                </Badge>

                <Typography variant="h5" gutterBottom>
                    {user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {user.email}
                </Typography>

                {!editMode && profile.bio && (
                    <Typography variant="body1" align="center" sx={{ mt: 1 }}>
                        {profile.bio}
                    </Typography>
                )}

                <Button
                    startIcon={editMode ? null : <EditIcon />}
                    onClick={() => setEditMode(!editMode)}
                    sx={{ mt: 2 }}
                    aria-label={editMode ? 'cancel editing' : 'edit profile'}
                >
                    {editMode ? 'Cancel Editing' : 'Edit Profile'}
                </Button>
            </Paper>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    aria-label="profile tabs"
                >
                    <Tab label="Profile" aria-label="profile tab" />
                    <Tab label="Preferences" aria-label="preferences tab" />
                    <Tab label="Notifications" aria-label="notifications tab" />
                </Tabs>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {activeTab === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        {editMode ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Bio"
                                    value={profile.bio}
                                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                                    aria-label="bio"
                                />
                                <TextField
                                    fullWidth
                                    label="Location"
                                    value={profile.location}
                                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                                    aria-label="location"
                                />
                                <TextField
                                    fullWidth
                                    label="GitHub"
                                    value={profile.github}
                                    onChange={(e) => setProfile(prev => ({ ...prev, github: e.target.value }))}
                                    InputProps={{
                                        startAdornment: <GitHubIcon sx={{ mr: 1 }} />
                                    }}
                                    aria-label="github"
                                />
                                <TextField
                                    fullWidth
                                    label="Twitter"
                                    value={profile.twitter}
                                    onChange={(e) => setProfile(prev => ({ ...prev, twitter: e.target.value }))}
                                    InputProps={{
                                        startAdornment: <TwitterIcon sx={{ mr: 1 }} />
                                    }}
                                    aria-label="twitter"
                                />
                                <TextField
                                    fullWidth
                                    label="LinkedIn"
                                    value={profile.linkedin}
                                    onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                                    InputProps={{
                                        startAdornment: <LinkedInIcon sx={{ mr: 1 }} />
                                    }}
                                    aria-label="linkedin"
                                />
                                <TextField
                                    fullWidth
                                    label="Website"
                                    value={profile.website}
                                    onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                                    InputProps={{
                                        startAdornment: <WebsiteIcon sx={{ mr: 1 }} />
                                    }}
                                    aria-label="website"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleSaveProfile}
                                    sx={{ mt: 2 }}
                                    aria-label="save profile"
                                >
                                    Save Changes
                                </Button>
                            </Box>
                        ) : (
                            <List>
                                {profile.location && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <TimeIcon />
                                        </ListItemIcon>
                                        <ListItemText primary="Location" secondary={profile.location} />
                                    </ListItem>
                                )}
                                {Object.entries({
                                    github: [profile.github, GitHubIcon],
                                    twitter: [profile.twitter, TwitterIcon],
                                    linkedin: [profile.linkedin, LinkedInIcon],
                                    website: [profile.website, WebsiteIcon]
                                }).map(([key, [value, Icon]]) => value && (
                                    <ListItemButton
                                        key={key}
                                        component="a"
                                        href={value}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={key}
                                    >
                                        <ListItemIcon>
                                            <Icon />
                                        </ListItemIcon>
                                        <ListItemText primary={key.charAt(0).toUpperCase() + key.slice(1)} secondary={value} />
                                    </ListItemButton>
                                ))}
                            </List>
                        )}
                    </motion.div>
                )}

                {activeTab === 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <List>
                            <ListItem>
                                <ListItemIcon>
                                    <PaletteIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Theme"
                                    secondary="Choose your preferred theme"
                                />
                                <TextField
                                    select
                                    size="small"
                                    value={preferences.theme}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                                    SelectProps={{
                                        native: true
                                    }}
                                    aria-label="theme"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">System</option>
                                </TextField>
                            </ListItem>

                            <ListItem>
                                <ListItemIcon>
                                    <TranslateIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Language"
                                    secondary="Select your preferred language"
                                />
                                <TextField
                                    select
                                    size="small"
                                    value={preferences.language}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                                    SelectProps={{
                                        native: true
                                    }}
                                    aria-label="language"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                </TextField>
                            </ListItem>

                            <ListItem>
                                <ListItemIcon>
                                    <NotificationsIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Notifications"
                                    secondary="Enable or disable notifications"
                                />
                                <Switch
                                    checked={preferences.notifications}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                                    aria-label="notifications"
                                />
                            </ListItem>

                            <ListItem>
                                <ListItemIcon>
                                    <EmojiIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Message Style"
                                    secondary="Customize your message appearance"
                                />
                                <TextField
                                    select
                                    size="small"
                                    value={preferences.bubbleStyle}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, bubbleStyle: e.target.value }))}
                                    SelectProps={{
                                        native: true
                                    }}
                                    aria-label="message style"
                                >
                                    <option value="modern">Modern</option>
                                    <option value="classic">Classic</option>
                                    <option value="minimal">Minimal</option>
                                </TextField>
                            </ListItem>

                            <ListItem>
                                <ListItemIcon>
                                    <PaletteIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Message Color"
                                    secondary="Choose your message bubble color"
                                />
                                <input
                                    type="color"
                                    value={preferences.messageColor}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, messageColor: e.target.value }))}
                                    style={{ width: 40, height: 40, padding: 0, border: 'none' }}
                                    aria-label="message color"
                                />
                            </ListItem>
                        </List>

                        <Box sx={{ p: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleSavePreferences}
                                aria-label="save preferences"
                            >
                                Save Preferences
                            </Button>
                        </Box>
                    </motion.div>
                )}

                {activeTab === 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <NotificationSettings />
                    </motion.div>
                )}
            </Box>

            <Dialog
                open={avatarDialogOpen}
                onClose={() => setAvatarDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                aria-labelledby="avatar-dialog-title"
            >
                <DialogTitle id="avatar-dialog-title">Update Profile Picture</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 2 }}>
                        <Avatar
                            src={newAvatar || user.profile?.avatar?.url}
                            sx={{ width: 150, height: 150 }}
                        >
                            {user.username ? user.username[0].toUpperCase() : '?'}
                        </Avatar>
                        <Button
                            variant="outlined"
                            component="label"
                            aria-label="choose file"
                        >
                            Choose File
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAvatarDialogOpen(false)} aria-label="cancel">Cancel</Button>
                    <Button
                        onClick={handleSaveAvatar}
                        disabled={!newAvatar}
                        variant="contained"
                        aria-label="save avatar"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserProfile;