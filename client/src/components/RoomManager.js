import React, { useState } from 'react';
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Autocomplete,
    Chip,
    FormControl,
    FormControlLabel,
    FormGroup,
    Switch,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Avatar,
    Tab,
    Tabs,
    InputAdornment,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Settings as SettingsIcon,
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Lock as LockIcon,
    Public as PublicIcon,
    Category as CategoryIcon,
    Tag as TagIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const RoomManager = ({
    rooms = [],
    categories = [],
    onCreateRoom,
    onEditRoom,
    onDeleteRoom,
    onInviteUser,
    onUpdateSettings
}) => {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomForm, setRoomForm] = useState({
        name: '',
        description: '',
        type: 'public',
        categories: [],
        tags: []
    });
    const [settingsForm, setSettingsForm] = useState({
        allowInvites: true,
        allowFileSharing: true,
        maxFileSize: 10,
        requireApproval: false,
        readOnly: false,
        slowMode: {
            enabled: false,
            delay: 0
        }
    });

    const handleCreateRoom = () => {
        onCreateRoom(roomForm);
        setRoomForm({
            name: '',
            description: '',
            type: 'public',
            categories: [],
            tags: []
        });
        setOpen(false);
    };

    const handleEditRoom = () => {
        onEditRoom(selectedRoom.id, roomForm);
        setSelectedRoom(null);
        setOpen(false);
    };

    const handleUpdateSettings = () => {
        onUpdateSettings(selectedRoom.id, settingsForm);
    };

    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase())) ||
        room.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <>
            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                    aria-label="search rooms"
                />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setSelectedRoom(null);
                        setOpen(true);
                    }}
                    aria-label="create room"
                >
                    Create Room
                </Button>
            </Box>

            <AnimatePresence>
                {filteredRooms.map((room) => (
                    <motion.div
                        key={room.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Box
                            sx={{
                                mb: 2,
                                p: 2,
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                boxShadow: 1
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Avatar src={room.avatar?.url} aria-label="room avatar">
                                    {room.name[0].toUpperCase()}
                                </Avatar>
                                <Box sx={{ ml: 2, flexGrow: 1 }}>
                                    <Typography variant="h6">
                                        {room.name}
                                        {room.type === 'private' && (
                                            <LockIcon
                                                fontSize="small"
                                                sx={{ ml: 1, verticalAlign: 'middle' }}
                                                aria-label="private room"
                                            />
                                        )}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {room.description}
                                    </Typography>
                                </Box>
                                <Box>
                                    <IconButton
                                        onClick={() => {
                                            setSelectedRoom(room);
                                            setRoomForm({
                                                name: room.name,
                                                description: room.description,
                                                type: room.type,
                                                categories: room.categories,
                                                tags: room.tags
                                            });
                                            setOpen(true);
                                        }}
                                        aria-label="edit room"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => onDeleteRoom(room.id)}
                                        color="error"
                                        aria-label="delete room"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {room.categories.map((category) => (
                                    <Chip
                                        key={category}
                                        icon={<CategoryIcon />}
                                        label={category}
                                        size="small"
                                        aria-label={`category ${category}`}
                                    />
                                ))}
                                {room.tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        icon={<TagIcon />}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                        aria-label={`tag ${tag}`}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </motion.div>
                ))}
            </AnimatePresence>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
                aria-labelledby="room-dialog-title"
            >
                <DialogTitle id="room-dialog-title">
                    {selectedRoom ? 'Edit Room' : 'Create Room'}
                </DialogTitle>
                <DialogContent>
                    <Tabs
                        value={tab}
                        onChange={(e, newValue) => setTab(newValue)}
                        sx={{ mb: 2 }}
                        aria-label="room tabs"
                    >
                        <Tab label="Details" aria-label="details tab" />
                        <Tab label="Settings" disabled={!selectedRoom} aria-label="settings tab" />
                    </Tabs>

                    {tab === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Room Name"
                                fullWidth
                                value={roomForm.name}
                                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                                aria-label="room name"
                            />
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={3}
                                value={roomForm.description}
                                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                                aria-label="room description"
                            />
                            <FormControl>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={roomForm.type === 'private'}
                                                onChange={(e) => setRoomForm({
                                                    ...roomForm,
                                                    type: e.target.checked ? 'private' : 'public'
                                                })}
                                                aria-label="private room switch"
                                            />
                                        }
                                        label="Private Room"
                                    />
                                </FormGroup>
                            </FormControl>
                            <Autocomplete
                                multiple
                                options={categories}
                                value={roomForm.categories}
                                onChange={(e, newValue) => setRoomForm({
                                    ...roomForm,
                                    categories: newValue
                                })}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Categories"
                                        placeholder="Add categories"
                                        aria-label="categories"
                                    />
                                )}
                            />
                            <TextField
                                label="Tags"
                                placeholder="Add tags (comma separated)"
                                fullWidth
                                value={roomForm.tags.join(', ')}
                                onChange={(e) => setRoomForm({
                                    ...roomForm,
                                    tags: e.target.value.split(',').map(tag => tag.trim())
                                })}
                                aria-label="tags"
                            />
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settingsForm.allowInvites}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                allowInvites: e.target.checked
                                            })}
                                            aria-label="allow invites switch"
                                        />
                                    }
                                    label="Allow Invites"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settingsForm.allowFileSharing}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                allowFileSharing: e.target.checked
                                            })}
                                            aria-label="allow file sharing switch"
                                        />
                                    }
                                    label="Allow File Sharing"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settingsForm.requireApproval}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                requireApproval: e.target.checked
                                            })}
                                            aria-label="require approval switch"
                                        />
                                    }
                                    label="Require Approval for New Members"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settingsForm.readOnly}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                readOnly: e.target.checked
                                            })}
                                            aria-label="read only switch"
                                        />
                                    }
                                    label="Read Only"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settingsForm.slowMode.enabled}
                                            onChange={(e) => setSettingsForm({
                                                ...settingsForm,
                                                slowMode: {
                                                    ...settingsForm.slowMode,
                                                    enabled: e.target.checked
                                                }
                                            })}
                                            aria-label="slow mode switch"
                                        />
                                    }
                                    label="Slow Mode"
                                />
                            </FormGroup>

                            {settingsForm.slowMode.enabled && (
                                <TextField
                                    label="Slow Mode Delay (seconds)"
                                    type="number"
                                    value={settingsForm.slowMode.delay}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        slowMode: {
                                            ...settingsForm.slowMode,
                                            delay: parseInt(e.target.value)
                                        }
                                    })}
                                    aria-label="slow mode delay"
                                />
                            )}

                            {settingsForm.allowFileSharing && (
                                <TextField
                                    label="Max File Size (MB)"
                                    type="number"
                                    value={settingsForm.maxFileSize}
                                    onChange={(e) => setSettingsForm({
                                        ...settingsForm,
                                        maxFileSize: parseInt(e.target.value)
                                    })}
                                    aria-label="max file size"
                                />
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} aria-label="cancel">Cancel</Button>
                    {tab === 0 ? (
                        <Button
                            onClick={selectedRoom ? handleEditRoom : handleCreateRoom}
                            variant="contained"
                            disabled={!roomForm.name.trim()}
                            aria-label={selectedRoom ? 'save changes' : 'create room'}
                        >
                            {selectedRoom ? 'Save Changes' : 'Create'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleUpdateSettings}
                            variant="contained"
                            aria-label="update settings"
                        >
                            Update Settings
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};

export default RoomManager;





