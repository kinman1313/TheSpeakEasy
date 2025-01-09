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
                                <Avatar src={room.avatar?.url}>
                                    {room.name[0].toUpperCase()}
                                </Avatar>
                                <Box sx={{ ml: 2, flexGrow: 1 }}>
                                    <Typography variant="h6">
                                        {room.name}
                                        {room.type === 'private' && (
                                            <LockIcon
                                                fontSize="small"
                                                sx={{ ml: 1, verticalAlign: 'middle' }}
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
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => onDeleteRoom(room.id)}
                                        color="error"
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
                                    />
                                ))}
                                {room.tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        icon={<TagIcon />}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
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
            >
                <DialogTitle>
                    {selectedRoom ? 'Edit Room' : 'Create Room'}
                </DialogTitle>
                <DialogContent>
                    <Tabs
                        value={tab}
                        onChange={(e, newValue) => setTab(newValue)}
                        sx={{ mb: 2 }}
                    >
                        <Tab label="Details" />
                        <Tab label="Settings" disabled={!selectedRoom} />
                    </Tabs>

                    {tab === 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Room Name"
                                fullWidth
                                value={roomForm.name}
                                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                            />
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={3}
                                value={roomForm.description}
                                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
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
                                />
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    {tab === 0 ? (
                        <Button
                            onClick={selectedRoom ? handleEditRoom : handleCreateRoom}
                            variant="contained"
                            disabled={!roomForm.name.trim()}
                        >
                            {selectedRoom ? 'Save Changes' : 'Create'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleUpdateSettings}
                            variant="contained"
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