import React, { useState } from 'react';
import {
    Box,
    Avatar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress
} from '@mui/material';
import { PhotoCamera, Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfilePicture({ size = 40, showEditButton = true, onClose }) {
    const { user, updateProfile } = useAuth();
    const [open, setOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setError('File size must be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        setError('');
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('avatar', selectedFile);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/upload-avatar', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to upload avatar');
            }

            if (!data.success) {
                throw new Error(data.message || data.error || 'Failed to upload avatar');
            }

            await updateProfile({ avatarUrl: data.avatarUrl });

            const timestamp = new Date().getTime();
            const newAvatarUrl = `${data.avatarUrl}?t=${timestamp}`;
            await updateProfile({ avatarUrl: newAvatarUrl });

            setOpen(false);
            if (onClose) onClose();
        } catch (err) {
            console.error('Avatar upload error:', err);
            setError(err.message || 'Failed to upload avatar');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        setError('');
        if (onClose) onClose();
    };

    return (
        <>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                    src={user?.avatarUrl}
                    sx={{
                        width: size,
                        height: size,
                        cursor: showEditButton ? 'pointer' : 'default'
                    }}
                    onClick={() => showEditButton && setOpen(true)}
                >
                    {user?.username?.[0]?.toUpperCase()}
                </Avatar>
                {showEditButton && (
                    <IconButton
                        size="small"
                        sx={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            backgroundColor: 'primary.main',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            },
                        }}
                        onClick={() => setOpen(true)}
                    >
                        <PhotoCamera sx={{ fontSize: 16 }} />
                    </IconButton>
                )}
            </Box>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Update Profile Picture
                    <IconButton
                        onClick={handleClose}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Avatar
                            src={previewUrl || user?.avatarUrl}
                            sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
                        >
                            {user?.username?.[0]?.toUpperCase()}
                        </Avatar>

                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="avatar-upload"
                            type="file"
                            onChange={handleFileSelect}
                        />
                        <label htmlFor="avatar-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                disabled={loading}
                            >
                                Choose Image
                            </Button>
                        </label>

                        {error && (
                            <Typography color="error" sx={{ mt: 2 }}>
                                {error}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        variant="contained"
                        disabled={!selectedFile || loading}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        Upload
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 