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
    Toolbar
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

const drawerWidth = {
    xs: '100%',
    sm: 240,
    md: 280
};

export default function Chat() {
    // Context hooks
    const { socket } = useSocket();
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
        opacity: 0.75,
        blur: 16,
        border: 'rgba(255, 255, 255, 0.125)'
    });

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
                const response = await fetch('/api/rooms', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Fetched rooms:', data);

                // Check if public lobby exists
                let publicLobby = data.rooms?.find(room => room.name === 'Public Lobby');

                if (!publicLobby) {
                    // Create public lobby if it doesn't exist
                    const createResponse = await fetch('/api/rooms', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            name: 'Public Lobby',
                            topic: 'Welcome to the chat!',
                            isPrivate: false,
                            isLobby: true
                        })
                    });

                    if (!createResponse.ok) {
                        throw new Error('Failed to create public lobby');
                    }

                    const createData = await createResponse.json();
                    publicLobby = createData.room;
                    data.rooms = [...(data.rooms || []), publicLobby];
                }

                setRooms(data.rooms || []);

                // Always join public lobby first if no active room
                if (!activeRoom) {
                    setActiveRoom(publicLobby.id);
                    socket?.emit('join_room', publicLobby.id);
                }
            } catch (error) {
                console.error('Error fetching/creating rooms:', error);
                // Set default public lobby in state if everything fails
                const defaultLobby = {
                    id: 'public-lobby',
                    name: 'Public Lobby',
                    topic: 'Welcome to the chat!',
                    isPrivate: false,
                    isLobby: true
                };
                setRooms([defaultLobby]);
                setActiveRoom(defaultLobby.id);
                socket?.emit('join_room', defaultLobby.id);
            } finally {
                setLoading(false);
            }
        };

        if (socket && socketConnected) {
            fetchRooms();
        }
    }, [socket, socketConnected, activeRoom]);

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth.sm}px)` },
                    ml: { sm: `${drawerWidth.sm}px` },
                    display: { sm: 'none' }
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {activeRoom ? rooms.find(r => r.id === activeRoom)?.name : 'Chat'}
                    </Typography>
                </Toolbar>
            </AppBar>

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
                        boxSizing: 'border-box',
                        width: drawerWidth.xs
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

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth.sm
                    }
                }}
                open
            >
                <RoomList
                    rooms={rooms}
                    activeRoom={activeRoom}
                    onRoomSelect={setActiveRoom}
                    onNewRoom={() => setShowNewRoomDialog(true)}
                />
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth.sm}px)` },
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Toolbar sx={{ display: { sm: 'none' } }} />

                <MessageThread
                    messages={messages}
                    typingUsers={typingUsers}
                    onMessageDelete={(messageId) => {
                        setMessages(prev => prev.filter(m => m._id !== messageId));
                    }}
                    containerRef={messagesContainerRef}
                    endRef={messagesEndRef}
                />

                <Box sx={{ mt: 2 }}>
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
                <DialogTitle>Record Voice Message</DialogTitle>
                <DialogContent>
                    <VoiceMessage
                        onRecordingComplete={(blob) => {
                            // Handle voice message
                            setShowVoiceMessage(false);
                        }}
                    />
                </DialogContent>
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
            >
                <MenuItem onClick={handleProfileSettings}>
                    <ListItemIcon>
                        <AccountIcon />
                    </ListItemIcon>
                    <ListItemText primary="Profile Settings" />
                </MenuItem>
                <MenuItem onClick={() => {
                    setUserMenuAnchor(null);
                    setShowBubbleCustomizer(true);
                }}>
                    <ListItemIcon>
                        <FormatPaintIcon />
                    </ListItemIcon>
                    <ListItemText primary="Customize Chat" />
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon />
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

            <Dialog
                open={showBubbleCustomizer}
                onClose={() => setShowBubbleCustomizer(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Customize Chat Bubbles</DialogTitle>
                <DialogContent>
                    <ChatBubbleCustomizer
                        settings={bubbleSettings}
                        onChange={setBubbleSettings}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
} 