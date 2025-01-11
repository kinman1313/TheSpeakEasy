import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Box,
    Typography,
    Alert
} from '@mui/material';

const NewRoomDialog = ({ open, onClose, onCreateRoom }) => {
    const [roomData, setRoomData] = useState({
        name: '',
        topic: '',
        isPrivate: false,
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setRoomData(prev => ({
            ...prev,
            [name]: name === 'isPrivate' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!roomData.name.trim()) {
            setError('Room name is required');
            return;
        }

        if (roomData.isPrivate && !roomData.password.trim()) {
            setError('Password is required for private rooms');
            return;
        }

        try {
            await onCreateRoom(roomData);
            handleClose();
        } catch (error) {
            setError(error.message || 'Failed to create room');
        }
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
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Room</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            name="name"
                            label="Room Name"
                            value={roomData.name}
                            onChange={handleChange}
                            fullWidth
                            required
                            autoFocus
                        />
                        <TextField
                            name="topic"
                            label="Room Topic (Optional)"
                            value={roomData.topic}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    name="isPrivate"
                                    checked={roomData.isPrivate}
                                    onChange={handleChange}
                                />
                            }
                            label="Private Room"
                        />
                        {roomData.isPrivate && (
                            <>
                                <TextField
                                    name="password"
                                    label="Room Password"
                                    type="password"
                                    value={roomData.password}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Private rooms require a password to join
                                </Typography>
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Create Room
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default NewRoomDialog; 