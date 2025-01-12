import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Drawer,
    IconButton,
    Typography,
    Menu,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    ListItemIcon,
    Switch,
    AppBar,
    Toolbar,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Menu as MenuIcon,
    Timer as TimerIcon,
    Check as CheckIcon,
    FormatPaint as FormatPaintIcon,
    AccountCircle as AccountIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import RoomList from './RoomList';
import MessageThread from './MessageThread';
import ChatInput from './ChatInput';
import GifPicker from './GifPicker';
import VoiceMessage from './VoiceMessage';
import MessageScheduler from './MessageScheduler';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '../contexts/ThemeContext';
import ChatBubbleCustomizer from './ChatBubbleCustomizer';
import NewRoomDialog from './NewRoomDialog';
import RoomSettings from './RoomSettings';
import { config } from '../config';
import ProfileSettings from './ProfileSettings';

const drawerWidth = {
    xs: '240px',
    sm: '280px',
    md: '320px'
};

// Add glassmorphism styles
const glassStyle = {
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px) brightness(1.4) invert()',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.25)',
    transition: 'all 0.3s ease-in-out'
};

export default function Chat() {
    // Context hooks
    const { socket, isConnected, joinRoom } = useSocket();
    const { user } = useAuth();
    const { theme } = useTheme();

    // Refs
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const messageInputRef = useRef(null);
    const reconnectAttempts = useRef(0);

    // Constants
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    // State declarations
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [showVoiceMessage, setShowVoiceMessage] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [messageVanishTime, setMessageVanishTime] = useState(null);
    const [messageSettingsAnchor, setMessageSettingsAnchor] = useState(null);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const [notificationSound, setNotificationSound] = useState(true);
    const [desktopNotifications, setDesktopNotifications] = useState(true);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [showProfileSettings, setShowProfileSettings] = useState(false);
    const [showBubbleCustomizer, setShowBubbleCustomizer] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [showScheduler, setShowScheduler] = useState(false);
    const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
    const [showRoomSettings, setShowRoomSettings] = useState(false);
    const [activeRoomDetails, setActiveRoomDetails] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(false);
    const [bubbleSettings, setBubbleSettings] = useState({
        type: 'solid',
        color1: '#1a1a40',
        color2: '#4a4a80',
        gradientDirection: '135deg',
        opacity: 3,
        blur: 16,
        border: 'rgba(255, 255, 255, 0.125)'
    });
    const [showConnectionError, setShowConnectionError] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('');
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    // Handle drawer toggle
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Handle menu close
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Handle user menu close
    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    // Handle profile settings
    const handleProfileSettings = () => {
        setUserMenuAnchor(null);
        setShowProfileSettings(true);
    };

    // Handle bubble customization
    const handleBubbleCustomize = () => {
        setUserMenuAnchor(null);
        setShowBubbleCustomizer(true);
    };

    // Handle bubble settings save
    const handleBubbleSettingsSave = (newSettings) => {
        setBubbleSettings(newSettings);
        setShowBubbleCustomizer(false);
        // Save to localStorage for persistence
        localStorage.setItem('bubbleSettings', JSON.stringify(newSettings));
    };

    // Load saved bubble settings on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('bubbleSettings');
        if (savedSettings) {
            setBubbleSettings(JSON.parse(savedSettings));
        }
    }, []);

    // Handle logout
    const handleLogout = () => {
        // Implement logout logic
        setUserMenuAnchor(null);
    };

    // Socket connection effect
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log('Socket connected successfully');
            setSocketConnected(true);
            setConnectionError(false);
            reconnectAttempts.current = 0;

            // Join active room after successful connection
            if (activeRoom) {
                socket.emit('join_room', activeRoom);
            }
        };

        const handleDisconnect = (reason) => {
            console.log('Socket disconnected:', reason);
            setSocketConnected(false);

            // Attempt reconnection if not manually closed
            if (reason !== 'io client disconnect') {
                handleReconnect();
            }
        };

        const handleConnectError = (error) => {
            console.error('Socket connection error:', error);
            setConnectionError(true);
            handleReconnect();
        };

        const handleReconnect = () => {
            if (reconnectAttempts.current >= maxReconnectAttempts) {
                console.log('Max reconnection attempts reached');
                setConnectionError(true);
                return;
            }

            reconnectAttempts.current += 1;
            console.log(`Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts}`);

            setTimeout(() => {
                if (socket) {
                    socket.connect();
                }
            }, reconnectDelay);
        };

        // Handle incoming messages
        const handleMessage = (newMessage) => {
            if (!socketConnected) return;

            console.log('Received message:', newMessage);
            setMessages(prevMessages => {
                // Check if message already exists
                const messageExists = prevMessages.some(msg =>
                    msg.timestamp === newMessage.timestamp &&
                    msg.sender === newMessage.sender &&
                    msg.content === newMessage.content
                );

                if (messageExists) {
                    console.log('Duplicate message detected, skipping');
                    return prevMessages;
                }

                return [...prevMessages, {
                    _id: newMessage._id || Date.now(),
                    ...newMessage
                }];
            });
        };

        // Handle user list updates
        const handleUserList = (users) => {
            if (!socketConnected) return;
            console.log('Online users:', users);
            setOnlineUsers(users);
        };

        // Handle typing indicators
        const handleTyping = ({ username, isTyping }) => {
            if (!socketConnected) return;
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                if (isTyping) {
                    newSet.add(username);
                } else {
                    newSet.delete(username);
                }
                return newSet;
            });
        };

        // Set up socket event listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('message', handleMessage);
        socket.on('userList', handleUserList);
        socket.on('typing', handleTyping);

        // Clean up event listeners
        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('message', handleMessage);
            socket.off('userList', handleUserList);
            socket.off('typing', handleTyping);
        };
    }, [socket, activeRoom, socketConnected, maxReconnectAttempts, reconnectDelay]);

    // Fetch rooms effect
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch(`${config.API_URL}/api/rooms`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Fetched rooms:', data);

                // Create default public lobby
                const defaultLobby = {
                    _id: 'public-lobby',
                    name: 'public-lobby',
                    topic: 'Welcome to The SpeakEasy',
                    isPrivate: false,
                    isLobby: true,
                    members: [],
                    admins: []
                };

                // Check if public lobby exists in fetched rooms
                const publicLobby = data.find(room => room.name === 'public-lobby') || defaultLobby;

                // Ensure public lobby is first in the list
                const roomsWithLobby = [
                    publicLobby,
                    ...(data.filter(room => room.name !== 'public-lobby') || [])
                ];

                setRooms(roomsWithLobby);

                // Join public lobby if no active room
                if (!activeRoom && isConnected) {
                    console.log('Joining public lobby:', publicLobby._id);
                    try {
                        await joinRoom(publicLobby._id);
                        setActiveRoom(publicLobby);
                        setConnectionError(false);
                    } catch (error) {
                        console.error('Failed to join public lobby:', error);
                        setConnectionError(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching rooms:', error);
                setConnectionError(true);

                // Set up default lobby as fallback
                const defaultLobby = {
                    _id: 'public-lobby',
                    name: 'public-lobby',
                    topic: 'Welcome to The SpeakEasy',
                    isPrivate: false,
                    isLobby: true,
                    members: [],
                    admins: []
                };

                setRooms([defaultLobby]);
                if (!activeRoom && isConnected) {
                    try {
                        await joinRoom(defaultLobby._id);
                        setActiveRoom(defaultLobby);
                    } catch (joinError) {
                        console.error('Failed to join default lobby:', joinError);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        if (isConnected) {
            fetchRooms();
        }
    }, [isConnected, joinRoom, activeRoom]);

    useEffect(() => {
        if (connectionError) {
            setShowConnectionError(true);
            setConnectionStatus('Connection lost. Attempting to reconnect...');
        } else if (isConnected) {
            setShowConnectionError(false);
            setConnectionStatus('Connected');
        }
    }, [isConnected, connectionError]);

    return (
        <Box sx={{
            display: 'flex',
            minHeight: '100vh',
            bgcolor: '#0A0F1E',
            background: 'linear-gradient(135deg, #0A0F1E 0%, #1A1F3E 100%)',
            p: 3,
            gap: 3
        }}>
            {/* Connection Status Snackbar */}
            <Snackbar
                open={showConnectionError}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="error" variant="filled">
                    {connectionStatus}
                </Alert>
            </Snackbar>

            {/* Loading Indicator */}
            {loading && (
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    ...glassStyle,
                    p: 3
                }}>
                    <Typography>
                        Connecting to chat...
                    </Typography>
                </Box>
            )}

            {/* Left Sidebar */}
            <Box
                sx={{
                    width: { xs: 0, sm: drawerWidth.sm },
                    flexShrink: 0,
                    display: { xs: 'none', sm: 'block' }
                }}
            >
                <Box
                    sx={{
                        ...glassStyle,
                        height: 'calc(100vh - 48px)',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <RoomList
                        rooms={rooms}
                        activeRoom={activeRoom}
                        onRoomSelect={setActiveRoom}
                        onNewRoom={() => setShowNewRoomDialog(true)}
                    />
                </Box>
            </Box>

            {/* Main Content */}
            <Box
                sx={{
                    flexGrow: 1,
                    height: 'calc(100vh - 48px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                }}
            >
                {/* Top Bar */}
                <Box
                    sx={{
                        ...glassStyle,
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div">
                            {activeRoom ? rooms.find(r => r.id === activeRoom)?.name : 'Chat'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton onClick={() => setShowNotificationSettings(true)}>
                            <TimerIcon />
                        </IconButton>
                        <IconButton onClick={(e) => setUserMenuAnchor(e.currentTarget)}>
                            <AccountIcon />
                        </IconButton>
                    </Box>
                </Box>

                {/* Chat Area */}
                <Box
                    sx={{
                        ...glassStyle,
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        ref={messagesContainerRef}
                        sx={{
                            flexGrow: 1,
                            overflowY: 'auto',
                            p: 2,
                            '&::-webkit-scrollbar': {
                                width: '8px',
                                background: 'rgba(0, 0, 0, 0.1)'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '4px',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.2)'
                                }
                            }
                        }}
                    >
                        <MessageThread
                            messages={messages}
                            typingUsers={typingUsers}
                            onMessageDelete={(messageId) => {
                                setMessages(prev => prev.filter(m => m._id !== messageId));
                            }}
                            endRef={messagesEndRef}
                        />
                    </Box>

                    {/* Input Area */}
                    <Box
                        sx={{
                            p: 2,
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            background: 'rgba(15, 23, 42, 0.45)'
                        }}
                    >
                        <ChatInput
                            ref={messageInputRef}
                            onSendMessage={(content) => {
                                if (socket && socketConnected && content.trim()) {
                                    const message = {
                                        content: content.trim(),
                                        sender: user.username,
                                        roomId: activeRoom,
                                        timestamp: new Date().toISOString()
                                    };
                                    socket.emit('message', message);
                                }
                            }}
                            onVoiceMessage={() => setShowVoiceMessage(true)}
                            onGifClick={() => setShowGifPicker(true)}
                            onEmojiClick={() => setShowEmojiPicker(true)}
                            onScheduleMessage={() => setShowScheduler(true)}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Right Sidebar */}
            <Box
                sx={{
                    width: { xs: 0, md: 280 },
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    gap: 3
                }}
            >
                {/* User Profile Area */}
                <Box
                    sx={{
                        ...glassStyle,
                        p: 2,
                        height: '200px'
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Profile
                    </Typography>
                    {/* Add user profile content */}
                </Box>

                {/* Online Users Area */}
                <Box
                    sx={{
                        ...glassStyle,
                        p: 2,
                        flexGrow: 1
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Online Users
                    </Typography>
                    <List>
                        {onlineUsers.map(user => (
                            <ListItem key={user.id}>
                                <ListItemText primary={user.username} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Box>

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        ...glassStyle,
                        boxSizing: 'border-box',
                        width: drawerWidth.xs,
                        border: 'none',
                        borderRadius: 0
                    }
                }}
            >
                <RoomList
                    rooms={rooms}
                    activeRoom={activeRoom}
                    onRoomSelect={(roomId) => {
                        setActiveRoom(roomId);
                        setMobileOpen(false);
                    }}
                    onNewRoom={() => setShowNewRoomDialog(true)}
                />
            </Drawer>

            {/* Dialogs */}
            <NewRoomDialog
                open={showNewRoomDialog}
                onClose={() => setShowNewRoomDialog(false)}
                onCreateRoom={(roomData) => {
                    // Handle room creation
                    setShowNewRoomDialog(false);
                }}
            />

            <RoomSettings
                open={showRoomSettings}
                onClose={() => setShowRoomSettings(false)}
                room={activeRoomDetails}
            />

            <Dialog
                open={showVoiceMessage}
                onClose={() => setShowVoiceMessage(false)}
                maxWidth="sm"
                fullWidth
            >
                <VoiceMessage
                    onComplete={async (blob) => {
                        try {
                            // Create a FormData object to send the audio file
                            const formData = new FormData();
                            formData.append('audio', blob, 'voice-message.webm');
                            formData.append('roomId', activeRoom);

                            // Upload the audio file
                            const response = await fetch(`${config.API_URL}/api/messages/voice`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: formData,
                                credentials: 'include'
                            });

                            if (!response.ok) {
                                throw new Error('Failed to upload voice message');
                            }

                            const data = await response.json();

                            // Emit the message through socket
                            if (socket && socketConnected) {
                                socket.emit('message', {
                                    type: 'voice',
                                    content: data.url,
                                    roomId: activeRoom,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        } catch (error) {
                            console.error('Error sending voice message:', error);
                            // Show error to user
                            setConnectionError(true);
                            setConnectionStatus('Failed to send voice message');
                        }
                        setShowVoiceMessage(false);
                    }}
                />
            </Dialog>

            <Dialog
                open={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Select GIF</DialogTitle>
                <DialogContent>
                    <GifPicker
                        onGifSelect={(gifData) => {
                            // Handle GIF selection
                            setShowGifPicker(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                maxWidth="xs"
            >
                <DialogContent>
                    <Picker
                        data={data}
                        onEmojiSelect={(emoji) => {
                            if (messageInputRef.current) {
                                const input = messageInputRef.current;
                                const start = input.selectionStart;
                                const end = input.selectionEnd;
                                const text = input.value;
                                const before = text.substring(0, start);
                                const after = text.substring(end, text.length);
                                input.value = before + emoji.native + after;
                                input.selectionStart = input.selectionEnd = start + emoji.native.length;
                                input.focus();
                            }
                            setShowEmojiPicker(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={showScheduler}
                onClose={() => setShowScheduler(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Schedule Message</DialogTitle>
                <DialogContent>
                    <MessageScheduler
                        onSchedule={(message, time) => {
                            // Handle scheduled message
                            setShowScheduler(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Menu
                anchorEl={messageSettingsAnchor}
                open={Boolean(messageSettingsAnchor)}
                onClose={() => setMessageSettingsAnchor(null)}
            >
                <MenuItem onClick={() => {
                    setMessageVanishTime(null);
                    setMessageSettingsAnchor(null);
                }}>
                    <ListItemIcon>
                        <TimerIcon />
                    </ListItemIcon>
                    <ListItemText primary="Never" />
                    {!messageVanishTime && <CheckIcon />}
                </MenuItem>
                {[1, 5, 10, 30, 60].map((minutes) => (
                    <MenuItem
                        key={minutes}
                        onClick={() => {
                            setMessageVanishTime(minutes);
                            setMessageSettingsAnchor(null);
                        }}
                    >
                        <ListItemIcon>
                            <TimerIcon />
                        </ListItemIcon>
                        <ListItemText primary={`${minutes} minute${minutes === 1 ? '' : 's'}`} />
                        {messageVanishTime === minutes && <CheckIcon />}
                    </MenuItem>
                ))}
            </Menu>

            <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                PaperProps={{
                    sx: {
                        ...glassStyle,
                        mt: 1
                    }
                }}
            >
                <MenuItem onClick={handleProfileSettings}>
                    <ListItemIcon>
                        <AccountIcon sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary="Profile Settings" />
                </MenuItem>
                <MenuItem onClick={handleBubbleCustomize}>
                    <ListItemIcon>
                        <FormatPaintIcon sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary="Customize Chat" />
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </MenuItem>
            </Menu>

            <Dialog
                open={showNotificationSettings}
                onClose={() => setShowNotificationSettings(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Notification Settings</DialogTitle>
                <DialogContent>
                    <List>
                        <ListItem>
                            <ListItemText
                                primary="Notification Sound"
                                secondary="Play a sound when receiving messages"
                            />
                            <Switch
                                edge="end"
                                checked={notificationSound}
                                onChange={(e) => setNotificationSound(e.target.checked)}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Desktop Notifications"
                                secondary="Show desktop notifications"
                            />
                            <Switch
                                edge="end"
                                checked={desktopNotifications}
                                onChange={(e) => setDesktopNotifications(e.target.checked)}
                            />
                        </ListItem>
                    </List>
                </DialogContent>
            </Dialog>

            <ChatBubbleCustomizer
                open={showBubbleCustomizer}
                onClose={() => setShowBubbleCustomizer(false)}
                onSave={handleBubbleSettingsSave}
                initialSettings={bubbleSettings}
            />

            <Snackbar
                open={connectionError}
                autoHideDuration={6000}
                onClose={() => setConnectionError(false)}
            >
                <Alert
                    onClose={() => setConnectionError(false)}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                    Connection lost. Please check your internet connection and try again.
                </Alert>
            </Snackbar>
        </Box>
    );
} 