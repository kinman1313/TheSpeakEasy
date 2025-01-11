import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
    AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

const RoomSettings = ({ open, onClose, room, onUpdateTopic, onAddMember, onRemoveMember, onPromoteToAdmin, onDemoteFromAdmin, isAdmin }) => {
    const [topic, setTopic] = useState(room?.topic || '');
    const [editingTopic, setEditingTopic] = useState(false);
    const [error, setError] = useState('');

    const handleTopicSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await onUpdateTopic(topic);
            setEditingTopic(false);
        } catch (error) {
            setError(error.message || 'Failed to update topic');
        }
    };

    const handleAddMember = async (userId) => {
        try {
            await onAddMember(userId);
        } catch (error) {
            setError(error.message || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            await onRemoveMember(userId);
        } catch (error) {
            setError(error.message || 'Failed to remove member');
        }
    };

    const handlePromoteToAdmin = async (userId) => {
        try {
            await onPromoteToAdmin(userId);
        } catch (error) {
            setError(error.message || 'Failed to promote member');
        }
    };

    const handleDemoteFromAdmin = async (userId) => {
        try {
            await onDemoteFromAdmin(userId);
        } catch (error) {
            setError(error.message || 'Failed to demote admin');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Room Settings</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Room Topic
                    </Typography>
                    {editingTopic ? (
                        <form onSubmit={handleTopicSubmit}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Set a topic for this room"
                                />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Button type="submit" variant="contained" size="small">
                                        Save
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setTopic(room?.topic || '');
                                            setEditingTopic(false);
                                        }}
                                        size="small"
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        </form>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Typography variant="body1" sx={{ flex: 1 }}>
                                {room?.topic || 'No topic set'}
                            </Typography>
                            {isAdmin && (
                                <IconButton
                                    onClick={() => setEditingTopic(true)}
                                    size="small"
                                >
                                    <EditIcon />
                                </IconButton>
                            )}
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                    Members
                </Typography>
                <List>
                    {room?.members?.map((member) => (
                        <ListItem key={member.id}>
                            <ListItemText
                                primary={member.username}
                                secondary={room.admins.includes(member.id) ? 'Admin' : 'Member'}
                            />
                            {isAdmin && member.id !== room.creator && (
                                <ListItemSecondaryAction>
                                    {room.admins.includes(member.id) ? (
                                        <IconButton
                                            onClick={() => handleDemoteFromAdmin(member.id)}
                                            size="small"
                                            title="Remove admin privileges"
                                        >
                                            <AdminIcon color="primary" />
                                        </IconButton>
                                    ) : (
                                        <IconButton
                                            onClick={() => handlePromoteToAdmin(member.id)}
                                            size="small"
                                            title="Make admin"
                                        >
                                            <AdminIcon />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        onClick={() => handleRemoveMember(member.id)}
                                        size="small"
                                        title="Remove from room"
                                    >
                                        <PersonRemoveIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            )}
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default RoomSettings; 