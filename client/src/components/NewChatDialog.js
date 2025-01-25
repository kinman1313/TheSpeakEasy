import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Switch,
    FormControlLabel,
    IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function NewChatDialog({ open, onClose, onCreateRoom }) {
    const [roomData, setRoomData] = useState({
        name: '',
        topic: '',
        isPrivate: false,
        password: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!roomData.name.trim()) {
            setError('Room name is required');
            return;
        }

        if (roomData.isPrivate && !roomData.password.trim()) {
            setError('Password is required for private rooms');
            return;
        }

        onCreateRoom(roomData);
        handleClose();
    };

    const handleClose = () => {
        setRoomData({
            name: '',
            topic: '',
            isPrivate: false,
            password: ''
        });
        setError('');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    backgroundColor: 'rgba(17, 25, 40, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.125)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    borderRadius: '12px',
                    color: 'white'
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.125)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                Create New Chat Room
                <IconButton
                    onClick={handleClose}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                    <TextField
                        label="Room Name"
                        value={roomData.name}
                        onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
                        fullWidth
                        required
                        InputProps={{
                            sx: {
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.7)'
                                }
                            }
                        }}
                        InputLabelProps={{
                            sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                    />

                    <TextField
                        label="Room Topic (optional)"
                        value={roomData.topic}
                        onChange={(e) => setRoomData({ ...roomData, topic: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        InputProps={{
                            sx: {
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.7)'
                                }
                            }
                        }}
                        InputLabelProps={{
                            sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={roomData.isPrivate}
                                onChange={(e) => setRoomData({ ...roomData, isPrivate: e.target.checked })}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: 'primary.main'
                                    }
                                }}
                            />
                        }
                        label="Private Room"
                        sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    />

                    {roomData.isPrivate && (
                        <TextField
                            label="Room Password"
                            type="password"
                            value={roomData.password}
                            onChange={(e) => setRoomData({ ...roomData, password: e.target.value })}
                            fullWidth
                            required
                            InputProps={{
                                sx: {
                                    color: 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.7)'
                                    }
                                }
                            }}
                            InputLabelProps={{
                                sx: { color: 'rgba(255, 255, 255, 0.7)' }
                            }}
                        />
                    )}

                    {error && (
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{
                borderTop: '1px solid rgba(255, 255, 255, 0.125)',
                p: 2
            }}>
                <Button
                    onClick={handleClose}
                    sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)'
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'primary.dark'
                        }
                    }}
                >
                    Create Room
                </Button>
            </DialogActions>
        </Dialog>
    );
} 