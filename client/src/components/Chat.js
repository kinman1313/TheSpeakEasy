import React, { useState, useEffect, useRef } from 'react';
import { Box, Drawer, IconButton, Divider, Typography, Avatar, Menu, MenuItem, Tooltip, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, ListItemIcon, Switch, AppBar, Toolbar, ListSubheader } from '@mui/material';
import {
    Add as AddIcon,
    Send as SendIcon,
    Gif as GifIcon,
    Mic as MicIcon,
    Schedule as ScheduleIcon,
    EmojiEmotions as EmojiIcon,
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Settings as SettingsIcon,
    People as PeopleIcon,
    AccountCircle as AccountIcon,
    Logout as LogoutIcon,
    Timer as TimerIcon,
    Check as CheckIcon,
    FormatPaint as FormatPaintIcon,
    Search as SearchIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import RoomList from './RoomList';
import MessageThread from './MessageThread';
import ChatInput from './ChatInput';
import GifPicker from './GifPicker';
import VoiceMessage from './VoiceMessage';
import MessageScheduler from './MessageScheduler';
import TypingIndicator from './TypingIndicator';
import NewChatDialog from './NewChatDialog';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '../contexts/ThemeContext';
import ProfilePicture from './ProfilePicture';
import ChatBubbleCustomizer from './ChatBubbleCustomizer';
import NewRoomDialog from './NewRoomDialog';
import RoomSettings from './RoomSettings';

const drawerWidth = {
    xs: '100%',
    sm: 240,
    md: 280
};

export default function Chat() {
    const { socket } = useSocket();
    const { user } = useAuth();
    const { theme } = useTheme();
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
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
    const [bubbleSettings, setBubbleSettings] = useState({
        type: 'solid',
        color1: '#1a1a40',
        color2: '#4a4a80',
        gradientDirection: '135deg',
        opacity: 0.75,
        blur: 16,
        border: 'rgba(255, 255, 255, 0.125)'
    });

    // Add missing state variables
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [showScheduler, setShowScheduler] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const messageInputRef = useRef(null);

    // Add mobile drawer state
    const [mobileOpen, setMobileOpen] = useState(false);

    // Add mobile drawer toggle handler
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Add state for showing new room dialog
    const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);

    // Add state for showing room settings
    const [showRoomSettings, setShowRoomSettings] = useState(false);
    const [activeRoomDetails, setActiveRoomDetails] = useState(null);

    // Add useEffect for fetching rooms
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch('/api/rooms', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setRooms(data.rooms);
                }
            } catch (error) {
                console.error('Error fetching rooms:', error);
            }
        };

        fetchRooms();
    }, []);

    // Add room creation handler
    const handleCreateRoom = async (roomData) => {
        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(roomData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create room');
            }

            setRooms(prevRooms => [...prevRooms, data.room]);
            setActiveRoom(data.room.id);
            socket.emit('join_room', data.room.id);
        } catch (error) {
            throw error;
        }
    };

    // Add room joining handler
    const handleJoinRoom = async (roomId, password = null) => {
        try {
            const response = await fetch(`/api/rooms/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to join room');
            }

            setActiveRoom(roomId);
            socket.emit('join_room', roomId);
        } catch (error) {
            console.error('Error joining room:', error);
        }
    };

    useEffect(() => {
        if (socket) {
            // Connect to the socket and join public lobby
            socket.connect();
            socket.emit('join', 'public-lobby');

            // Handle incoming messages
            socket.on('message', (newMessage) => {
                console.log('Received message:', newMessage); // Debug log
                setMessages(prevMessages => {
                    // Check if message already exists to prevent duplicates
                    const messageExists = prevMessages.some(msg =>
                        msg.timestamp === newMessage.timestamp &&
                        msg.sender === newMessage.sender &&
                        msg.content === newMessage.content
                    );
                    if (messageExists) return prevMessages;

                    return [...prevMessages, {
                        _id: Date.now(), // Ensure unique ID
                        ...newMessage,
                        timestamp: newMessage.timestamp || new Date().toISOString()
                    }];
                });
                scrollToBottom();
            });

            // Handle user list updates
            socket.on('userList', (users) => {
                console.log('Online users:', users); // Debug log
                setOnlineUsers(users);
            });

            // Handle typing indicators
            socket.on('typing', ({ username, isTyping }) => {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    if (isTyping) {
                        newSet.add(username);
                    } else {
                        newSet.delete(username);
                    }
                    return newSet;
                });
            });

            // Handle connection/disconnection
            socket.on('connect', () => {
                console.log('Connected to server');
                setLoading(false);
            });

            socket.on('disconnect', () => {
                console.log('Disconnected from server');
                setLoading(true);
            });

            // Cleanup on unmount
            return () => {
                socket.off('message');
                socket.off('typing');
                socket.off('userList');
                socket.off('connect');
                socket.off('disconnect');
                socket.disconnect();
            };
        }
    }, [socket]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            const handleWheel = (event) => {
                // Smooth scroll behavior
                const delta = event.deltaY;
                const currentScroll = container.scrollTop;
                const maxScroll = container.scrollHeight - container.clientHeight;

                // Prevent overscroll bounce
                if ((currentScroll <= 0 && delta < 0) ||
                    (currentScroll >= maxScroll && delta > 0)) {
                    return;
                }
            };

            // Add passive wheel event listener
            container.addEventListener('wheel', handleWheel, { passive: true });

            return () => {
                container.removeEventListener('wheel', handleWheel);
            };
        }
    }, []);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            const handleScroll = () => {
                // Load more messages when scrolling to top
                if (container.scrollTop === 0) {
                    // You can implement loading previous messages here
                    console.log('Reached top, could load more messages');
                }
            };

            // Add passive scroll event listener
            container.addEventListener('scroll', handleScroll, { passive: true });

            return () => {
                container.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    const scrollToBottom = (behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior,
                block: 'end',
            });
        }
    };

    // Add this new effect to handle initial scroll and new messages
    useEffect(() => {
        if (messages.length > 0) {
            // Use instant scroll for initial load
            scrollToBottom(messages.length === 1 ? 'instant' : 'smooth');
        }
    }, [messages]);

    const handleGifSelect = (gif) => {
        handleSendMessage(gif.url, 'gif', {
            width: gif.width,
            height: gif.height,
            title: gif.title
        });
        setShowGifPicker(false);
    };

    const handleVoiceMessage = (audioBlob) => {
        if (!audioBlob || !(audioBlob instanceof Blob)) {
            console.error('Invalid audio blob:', audioBlob);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const audioDataUrl = reader.result;
            handleSendMessage(audioDataUrl, 'voice', {
                duration: 0, // Duration will be set when audio is loaded in the player
                type: audioBlob.type,
                size: audioBlob.size
            });
        };
        reader.onerror = (error) => {
            console.error('Error reading audio blob:', error);
        };
        reader.readAsDataURL(audioBlob);
        setShowVoiceMessage(false);
    };

    const handleScheduleMessage = (message, scheduledTime) => {
        const scheduledMsg = {
            content: message,
            scheduledTime,
            id: Date.now()
        };
        setScheduledMessages(prev => [...prev, scheduledMsg]);
        setShowScheduler(false);
    };

    const handleSendMessage = (content, type = 'text', metadata = {}) => {
        if (!socket || !content) return;

        const message = {
            type,
            content,
            metadata: {
                ...metadata,
                vanishTime: messageVanishTime
            },
            sender: user.username,
            timestamp: new Date().toISOString()
        };

        console.log('Sending message:', message);
        socket.emit('message', message);
    };

    const handleLogout = () => {
        // Implement logout logic
        setUserMenuAnchor(null);
    };

    const handleProfileSettings = () => {
        setUserMenuAnchor(null);
        setShowProfileSettings(true);
    };

    useEffect(() => {
        if (messageVanishTime) {
            const now = Date.now();
            const timeouts = messages.map(message => {
                const messageTime = new Date(message.timestamp).getTime();
                const timeLeft = messageTime + (messageVanishTime * 60 * 1000) - now;

                if (timeLeft > 0) {
                    return setTimeout(() => {
                        setMessages(prev => prev.filter(m => m._id !== message._id));
                    }, timeLeft);
                }
                return null;
            }).filter(Boolean);

            return () => timeouts.forEach(timeout => clearTimeout(timeout));
        }
    }, [messageVanishTime, messages]);

    const handleVanishTimeSelect = (minutes) => {
        setMessageVanishTime(minutes);
        setMessageSettingsAnchor(null);
    };

    const handleSubmit = () => {
        const messageText = messageInputRef.current?.value?.trim();
        if (messageText) {
            handleSendMessage(messageText);
            messageInputRef.current.value = '';
            messageInputRef.current.focus();
        }
    };

    const handleReaction = (messageId, emoji) => {
        socket?.emit('reaction', {
            messageId,
            emoji,
            username: user.username
        });
    };

    const handleRemoveReaction = (messageId, emoji) => {
        socket?.emit('removeReaction', {
            messageId,
            emoji,
            username: user.username
        });
    };

    // Add handlers for voice, GIF, and emoji features
    const handleVoiceMessageStart = () => {
        setShowVoiceMessage(true);
    };

    const handleVoiceMessageComplete = (audioBlob) => {
        if (!audioBlob) return;
        const reader = new FileReader();
        reader.onload = () => {
            const audioDataUrl = reader.result;
            handleSendMessage(audioDataUrl, 'voice', {
                type: audioBlob.type,
                size: audioBlob.size
            });
        };
        reader.readAsDataURL(audioBlob);
        setShowVoiceMessage(false);
    };

    const handleEmojiSelect = (emoji) => {
        if (messageInputRef.current) {
            const start = messageInputRef.current.selectionStart;
            const end = messageInputRef.current.selectionEnd;
            const text = messageInputRef.current.value;
            const before = text.substring(0, start);
            const after = text.substring(end);
            const emojiChar = emoji.native || emoji;

            messageInputRef.current.value = before + emojiChar + after;
            messageInputRef.current.selectionStart = messageInputRef.current.selectionEnd = start + emojiChar.length;
            messageInputRef.current.focus();
        }
        setShowEmojiPicker(false);
    };

    const handleNotificationSettingsChange = (setting, value) => {
        switch (setting) {
            case 'sound':
                setNotificationSound(value);
                break;
            case 'desktop':
                setDesktopNotifications(value);
                if (value) {
                    Notification.requestPermission();
                }
                break;
            default:
                break;
        }
    };

    const handleBubbleSettingsSave = (newSettings) => {
        setBubbleSettings(newSettings);
        setShowBubbleCustomizer(false);
    };

    // Add room settings handlers
    const handleUpdateTopic = async (topic) => {
        try {
            const response = await fetch(`/api/rooms/${activeRoom}/topic`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ topic })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update topic');
            }

            socket.emit('update_topic', {
                roomId: activeRoom,
                topic
            });

            setActiveRoomDetails(prev => ({
                ...prev,
                topic
            }));
        } catch (error) {
            throw error;
        }
    };

    const handleAddMember = async (userId) => {
        try {
            const response = await fetch(`/api/rooms/${activeRoom}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add member');
            }

            setActiveRoomDetails(prev => ({
                ...prev,
                members: [...prev.members, data.member]
            }));
        } catch (error) {
            throw error;
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            const response = await fetch(`/api/rooms/${activeRoom}/members/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to remove member');
            }

            setActiveRoomDetails(prev => ({
                ...prev,
                members: prev.members.filter(member => member.id !== userId)
            }));
        } catch (error) {
            throw error;
        }
    };

    const handlePromoteToAdmin = async (userId) => {
        try {
            const response = await fetch(`/api/rooms/${activeRoom}/admins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to promote member');
            }

            setActiveRoomDetails(prev => ({
                ...prev,
                admins: [...prev.admins, userId]
            }));
        } catch (error) {
            throw error;
        }
    };

    const handleDemoteFromAdmin = async (userId) => {
        try {
            const response = await fetch(`/api/rooms/${activeRoom}/admins/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to demote admin');
            }

            setActiveRoomDetails(prev => ({
                ...prev,
                admins: prev.admins.filter(id => id !== userId)
            }));
        } catch (error) {
            throw error;
        }
    };

    // Update useEffect for fetching room details
    useEffect(() => {
        const fetchRoomDetails = async () => {
            if (!activeRoom) return;

            try {
                const response = await fetch(`/api/rooms/${activeRoom}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json();
                if (response.ok) {
                    setActiveRoomDetails(data.room);
                }
            } catch (error) {
                console.error('Error fetching room details:', error);
            }
        };

        fetchRoomDetails();
    }, [activeRoom]);

    // Add socket listeners for room events
    useEffect(() => {
        socket.on('topic_updated', ({ roomId, topic }) => {
            if (roomId === activeRoom) {
                setActiveRoomDetails(prev => ({
                    ...prev,
                    topic
                }));
            }
        });

        return () => {
            socket.off('topic_updated');
        };
    }, [activeRoom]);

    // Add drawer content component
    const drawerContent = (
        <Box sx={{ width: drawerWidth, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Rooms</Typography>
                <IconButton onClick={() => setShowNewRoomDialog(true)} color="primary">
                    <AddIcon />
                </IconButton>
            </Box>
            <Divider />
            <List sx={{ flex: 1, overflowY: 'auto' }}>
                {rooms.map(room => (
                    <ListItem
                        key={room.id}
                        button
                        selected={activeRoom === room.id}
                        onClick={() => handleJoinRoom(room.id)}
                    >
                        <ListItemText
                            primary={room.name}
                            secondary={room.topic || 'No topic set'}
                        />
                        {room.isPrivate && (
                            <LockIcon fontSize="small" sx={{ ml: 1, opacity: 0.5 }} />
                        )}
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    // Update the AppBar to include room settings button
    const appBar = (
        <AppBar
            position="fixed"
            sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
                bgcolor: 'background.paper',
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
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
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {activeRoomDetails?.name || 'Select a Room'}
                </Typography>
                {activeRoom && (
                    <IconButton
                        color="inherit"
                        onClick={() => setShowRoomSettings(true)}
                        title="Room Settings"
                    >
                        <SettingsIcon />
                    </IconButton>
                )}
            </Toolbar>
        </AppBar>
    );

    // Add the missing handler functions
    const handleRoomSelect = (room) => {
        setActiveRoom(room.id);
        socket.emit('join_room', room.id);
        setMobileOpen(false);
    };

    const handleStartDM = async (user) => {
        try {
            // Check if DM room already exists
            const existingRoom = rooms.find(room =>
                room.isDM && room.members.length === 2 &&
                room.members.some(member => member.id === user.id)
            );

            if (existingRoom) {
                handleRoomSelect(existingRoom);
                return;
            }

            // Create new DM room
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: `DM-${user.username}`,
                    isDM: true,
                    members: [user.id]
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create DM');
            }

            setRooms(prevRooms => [...prevRooms, data.room]);
            handleRoomSelect(data.room);
        } catch (error) {
            console.error('Error starting DM:', error);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* Mobile app bar */}
            {appBar}
            {/* Mobile drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true // Better mobile performance
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        width: drawerWidth.xs,
                        boxSizing: 'border-box',
                        backdropFilter: 'blur(16px)',
                        bgcolor: 'rgba(17, 25, 40, 0.95)',
                        border: 'none'
                    }
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    width: drawerWidth.sm,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth.sm,
                        boxSizing: 'border-box',
                        backdropFilter: 'blur(16px)',
                        bgcolor: 'rgba(17, 25, 40, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.125)'
                    }
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    pt: { xs: 7, sm: 0 }, // Account for mobile AppBar
                    pb: 2,
                    px: { xs: 1, sm: 2 },
                    overflow: 'hidden'
                }}
            >
                <Box
                    ref={messagesContainerRef}
                    sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        p: 2,
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05)',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.3)'
                            }
                        }
                    }}
                >
                    {messages.map((message) => (
                        <MessageThread
                            key={message._id}
                            message={message}
                            currentUser={user.username}
                            onReaction={handleReaction}
                            onRemoveReaction={handleRemoveReaction}
                            bubbleSettings={bubbleSettings}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </Box>

                <Paper
                    sx={{
                        p: { xs: 1, sm: 2 },
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        backgroundColor: 'rgba(17, 25, 40, 0.75)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.125)',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: '0 0 20px rgba(255, 255, 255, 0.15)'
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <IconButton
                            onClick={() => setShowEmojiPicker(true)}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    color: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <EmojiIcon />
                        </IconButton>

                        <IconButton
                            onClick={() => setShowGifPicker(true)}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    color: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <GifIcon />
                        </IconButton>

                        <IconButton
                            onClick={handleVoiceMessageStart}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    color: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <MicIcon />
                        </IconButton>

                        <IconButton
                            onClick={() => setShowScheduler(true)}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    color: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <ScheduleIcon />
                        </IconButton>

                        <IconButton
                            onClick={(e) => setMessageSettingsAnchor(e.currentTarget)}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    color: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <TimerIcon />
                        </IconButton>

                        <TextField
                            inputRef={messageInputRef}
                            fullWidth
                            placeholder="Type a message..."
                            variant="outlined"
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    color: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                                        boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)'
                                    },
                                    '& fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        transition: 'all 0.3s ease'
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.3)'
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'rgba(255, 255, 255, 0.5)',
                                        boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)'
                                    }
                                },
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <IconButton
                            onClick={() => handleSubmit()}
                            sx={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    color: 'white',
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            </Box>

            {showGifPicker && (
                <Dialog
                    open={showGifPicker}
                    onClose={() => setShowGifPicker(false)}
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            width: { xs: '95%', sm: 'auto' },
                            maxWidth: { xs: '95%', sm: 'md' },
                            margin: { xs: '10px', sm: '32px' },
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            backgroundColor: 'rgba(17, 25, 40, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.125)',
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 0 25px rgba(255, 255, 255, 0.2)'
                            }
                        }
                    }}
                >
                    <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
                </Dialog>
            )}

            {showVoiceMessage && (
                <Dialog
                    open={showVoiceMessage}
                    onClose={() => setShowVoiceMessage(false)}
                    PaperProps={{
                        sx: {
                            width: { xs: '95%', sm: 'auto' },
                            maxWidth: { xs: '95%', sm: 'md' },
                            margin: { xs: '10px', sm: '32px' },
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            backgroundColor: 'rgba(17, 25, 40, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.125)',
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 0 25px rgba(255, 255, 255, 0.2)'
                            }
                        }
                    }}
                >
                    <VoiceMessage
                        onSend={handleVoiceMessageComplete}
                        onClose={() => setShowVoiceMessage(false)}
                    />
                </Dialog>
            )}

            {showScheduler && (
                <Dialog
                    open={showScheduler}
                    onClose={() => setShowScheduler(false)}
                    PaperProps={{
                        sx: {
                            width: { xs: '95%', sm: 'auto' },
                            maxWidth: { xs: '95%', sm: 'md' },
                            margin: { xs: '10px', sm: '32px' },
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            backgroundColor: 'rgba(17, 25, 40, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.125)',
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                boxShadow: '0 0 25px rgba(255, 255, 255, 0.2)'
                            }
                        }
                    }}
                >
                    <MessageScheduler
                        onSchedule={handleScheduleMessage}
                        onClose={() => setShowScheduler(false)}
                    />
                </Dialog>
            )}

            <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={() => setUserMenuAnchor(null)}
                PaperProps={{
                    sx: {
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        backgroundColor: 'rgba(17, 25, 40, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.125)',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        borderRadius: '12px',
                        color: 'white',
                        minWidth: 200
                    }
                }}
            >
                <MenuItem onClick={handleProfileSettings}>
                    <ListItemIcon>
                        <AccountIcon sx={{ color: 'white' }} />
                    </ListItemIcon>
                    Profile Settings
                </MenuItem>
                <MenuItem onClick={() => {
                    setShowBubbleCustomizer(true);
                    setUserMenuAnchor(null);
                }}>
                    <ListItemIcon>
                        <FormatPaintIcon sx={{ color: 'white' }} />
                    </ListItemIcon>
                    Customize Chat Bubbles
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon sx={{ color: 'white' }} />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>

            {showEmojiPicker && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: '80px',
                        right: '20px',
                        zIndex: 9999,
                        backdropFilter: 'blur(16px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        backgroundColor: 'rgba(17, 25, 40, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.125)',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        borderRadius: '12px',
                        padding: '8px'
                    }}
                >
                    <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme="dark"
                        previewPosition="none"
                        perLine={8}
                        emojiSize={24}
                        showPreview={false}
                        showSkinTones={false}
                        style={{
                            width: '350px',
                            backgroundColor: 'transparent',
                            border: 'none'
                        }}
                    />
                </Box>
            )}

            {/* Profile Settings Dialog */}
            {showProfileSettings && (
                <Dialog
                    open={showProfileSettings}
                    onClose={() => setShowProfileSettings(false)}
                    PaperProps={{
                        sx: {
                            width: { xs: '95%', sm: 'auto' },
                            maxWidth: { xs: '95%', sm: 'md' },
                            margin: { xs: '10px', sm: '32px' },
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            backgroundColor: 'rgba(17, 25, 40, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.125)',
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                            borderRadius: '12px',
                            color: 'white',
                            minWidth: 400
                        }
                    }}
                >
                    <DialogTitle sx={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.125)',
                        color: 'white'
                    }}>
                        Profile Settings
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <ProfilePicture size={120} />
                            </Box>
                            <TextField
                                label="Username"
                                value={user?.username || ''}
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
                                label="Email"
                                value={user?.email || ''}
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
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.125)', p: 2 }}>
                        <Button
                            onClick={() => setShowProfileSettings(false)}
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
            )}

            <ChatBubbleCustomizer
                open={showBubbleCustomizer}
                onClose={() => setShowBubbleCustomizer(false)}
                onSave={handleBubbleSettingsSave}
                initialSettings={bubbleSettings}
            />

            {/* Add the Vanish Timer Menu */}
            <Menu
                anchorEl={messageSettingsAnchor}
                open={Boolean(messageSettingsAnchor)}
                onClose={() => setMessageSettingsAnchor(null)}
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
                <MenuItem onClick={() => handleVanishTimeSelect(null)}>
                    <ListItemIcon>
                        <TimerIcon sx={{ color: messageVanishTime === null ? '#4caf50' : 'white' }} />
                    </ListItemIcon>
                    <Typography>No Auto-Delete</Typography>
                    {messageVanishTime === null && (
                        <CheckIcon sx={{ ml: 1, color: '#4caf50' }} />
                    )}
                </MenuItem>
                {[1, 5, 10, 30, 60].map((minutes) => (
                    <MenuItem key={minutes} onClick={() => handleVanishTimeSelect(minutes)}>
                        <ListItemIcon>
                            <TimerIcon sx={{ color: messageVanishTime === minutes ? '#4caf50' : 'white' }} />
                        </ListItemIcon>
                        <Typography>Delete after {minutes} {minutes === 1 ? 'minute' : 'minutes'}</Typography>
                        {messageVanishTime === minutes && (
                            <CheckIcon sx={{ ml: 1, color: '#4caf50' }} />
                        )}
                    </MenuItem>
                ))}
            </Menu>

            <NewRoomDialog
                open={showNewRoomDialog}
                onClose={() => setShowNewRoomDialog(false)}
                onCreateRoom={handleCreateRoom}
            />

            <RoomSettings
                open={showRoomSettings}
                onClose={() => setShowRoomSettings(false)}
                room={activeRoomDetails}
                onUpdateTopic={handleUpdateTopic}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onPromoteToAdmin={handlePromoteToAdmin}
                onDemoteFromAdmin={handleDemoteFromAdmin}
                isAdmin={activeRoomDetails?.admins?.includes(user?._id)}
            />
        </Box>
    );
} 