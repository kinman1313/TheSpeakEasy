import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Avatar,
    IconButton,
    Typography,
    Alert
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';

export default function ProfileSettings({ open, onClose }) {
    const { user, updateUser } = useAuth();
    const [avatar, setAvatar] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef();

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                setError('Only JPEG, PNG and GIF files are allowed');
                return;
            }
            setAvatar(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');

            if (avatar) {
                const formData = new FormData();
                formData.append('avatar', avatar);

                const response = await fetch(`${config.API_URL}/api/users/upload-avatar`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Failed to upload avatar');
                }

                const data = await response.json();
                await updateUser({ ...user, avatarUrl: data.avatarUrl });
            }

            onClose();
        } catch (error) {
            console.error('Profile update error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    backgroundColor: 'rgba(17, 25, 40, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.125)',
                    borderRadius: '12px',
                    color: 'white'
                }
            }}
        >
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, p: 2 }}>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={previewUrl || '/default-avatar.png'}
                            sx={{ width: 120, height: 120, cursor: 'pointer' }}
                            onClick={handleAvatarClick}
                        />
                        <IconButton
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
                            }}
                            onClick={handleAvatarClick}
                        >
                            <PhotoCameraIcon sx={{ color: 'white' }} />
                        </IconButton>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Click to change avatar (Max 5MB, JPEG/PNG/GIF)
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} sx={{ color: 'white' }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    variant="contained"
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)'
                        }
                    }}
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
} 