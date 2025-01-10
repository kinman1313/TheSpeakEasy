import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import { config } from '../config';

export default function NewChatDialog({ open, onClose, onCreateDM }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm) return;

        setLoading(true);
        try {
            const response = await axios.get(`${config.API_URL}/api/users/search?q=${searchTerm}`);
            setSearchResults(response.data.users);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = (username) => {
        onCreateDM(username);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Search users"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                        endAdornment: (
                            <Button
                                onClick={handleSearch}
                                disabled={loading}
                                startIcon={<SearchIcon />}
                            >
                                Search
                            </Button>
                        )
                    }}
                    sx={{ mb: 2 }}
                />
                <List>
                    {searchResults.map((user) => (
                        <ListItem
                            key={user._id}
                            button
                            onClick={() => handleUserSelect(user.username)}
                        >
                            <ListItemAvatar>
                                <Avatar>{user.username[0].toUpperCase()}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={user.username}
                                secondary={user.email}
                            />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
} 