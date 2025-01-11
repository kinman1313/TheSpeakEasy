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
                backdropFilter: 'blur(20px) saturate(200%)',
                WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                backgroundColor: 'rgba(17, 25, 40, 0.6)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                    pointerEvents: 'none'
                }
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
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                padding: { xs: 2, md: 3 },
                gap: 3,
                background: `
                    linear-gradient(135deg, rgba(17, 25, 40, 0.97) 0%, rgba(31, 38, 135, 0.97) 100%),
                    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%),
                    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
                `,
                backgroundBlendMode: 'overlay',
                overflow: 'hidden'
            }}
        >
            {/* Left floating box - User list and chat menu */}
            <Box
                sx={{
                    width: { xs: '100%', md: 280 },
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    gap: 2,
                    height: 'calc(100vh - 48px)',
                    backdropFilter: 'blur(25px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: `
                        0 4px 24px -1px rgba(0, 0, 0, 0.3),
                        0 0 16px -2px rgba(0, 0, 0, 0.2),
                        0 0 1px 0 rgba(255, 255, 255, 0.2) inset,
                        0 0 20px 0 rgba(255, 255, 255, 0.1)
                    `,
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.6s ease-out',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: `
                            0 8px 32px -1px rgba(0, 0, 0, 0.4),
                            0 0 16px -2px rgba(0, 0, 0, 0.3),
                            0 0 1px 0 rgba(255, 255, 255, 0.3) inset,
                            0 0 25px 0 rgba(255, 255, 255, 0.15)
                        `,
                        backgroundColor: 'rgba(255, 255, 255, 0.04)'
                    },
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
                        pointerEvents: 'none'
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: -200,
                        left: -200,
                        right: -200,
                        height: '200%',
                        background: 'linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 48%, rgba(255,255,255,0.1) 52%, transparent 55%)',
                        animation: 'shine 8s infinite',
                        transform: 'rotate(35deg)',
                        pointerEvents: 'none'
                    }
                }}
            >
                {drawerContent}
            </Box>

            {/* Center floating box - Chat area */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    height: 'calc(100vh - 48px)',
                    backdropFilter: 'blur(20px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: `
                        0 4px 24px -1px rgba(0, 0, 0, 0.2),
                        0 0 16px -2px rgba(0, 0, 0, 0.1),
                        0 0 1px 0 rgba(255, 255, 255, 0.2) inset,
                        0 0 15px 0 rgba(255, 255, 255, 0.05)
                    `,
                    position: 'relative',
                    overflow: 'hidden',
                    padding: 3,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                        pointerEvents: 'none'
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: -200,
                        left: -200,
                        right: -200,
                        height: '200%',
                        background: 'linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 48%, rgba(255,255,255,0.1) 52%, transparent 55%)',
                        animation: 'shine 8s infinite',
                        transform: 'rotate(35deg)',
                        pointerEvents: 'none'
                    }
                }}
            >
                {/* Chat header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        backdropFilter: 'blur(20px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: '0 4px 12px -1px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <Typography variant="h6" sx={{ color: 'white' }}>
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
                </Box>

                {/* Messages area */}
                <Box
                    ref={messagesContainerRef}
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        p: 2,
                        backdropFilter: 'blur(20px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: '0 4px 12px -1px rgba(0, 0, 0, 0.1)',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05)',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                            height: '6px'
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '3px',
                            margin: '10px'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '3px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
                            }
                        },
                        '&::-webkit-scrollbar-corner': {
                            background: 'transparent'
                        }
                    }}
                >
                    {loading ? (
                        // Add loading skeleton animation
                        <Box sx={{ p: 2 }}>
                            {[...Array(3)].map((_, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        height: '60px',
                                        borderRadius: '12px',
                                        mb: 2,
                                        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
                                        backgroundSize: '1000px 100%',
                                        animation: 'shimmer 2s infinite linear'
                                    }}
                                />
                            ))}
                        </Box>
                    ) : (
                        messages.map((message, index) => (
                            <Box
                                key={message._id}
                                sx={{
                                    animation: `fadeIn 0.3s ease-out ${index * 0.1}s`,
                                    opacity: 0,
                                    animationFillMode: 'forwards'
                                }}
                            >
                                <MessageThread
                                    message={message}
                                    currentUser={user.username}
                                    onReaction={handleReaction}
                                    onRemoveReaction={handleRemoveReaction}
                                    bubbleSettings={bubbleSettings}
                                />
                            </Box>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Message input area */}
                <Paper
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    sx={{
                        p: { xs: 1, sm: 2 },
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        backdropFilter: 'blur(25px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 4px 12px -1px rgba(0, 0, 0, 0.2)',
                        position: 'relative',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            boxShadow: '0 8px 16px -1px rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.12)'
                        },
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)',
                            borderRadius: '16px',
                            pointerEvents: 'none'
                        }
                    }}
                >
                    <IconButton
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                color: 'rgba(255, 255, 255, 0.9)',
                                transform: 'scale(1.1)'
                            }
                        }}
                    >
                        <EmojiIcon />
                    </IconButton>

                    <IconButton
                        onClick={() => setShowGifPicker(!showGifPicker)}
                        sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                color: 'rgba(255, 255, 255, 0.9)',
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
                                color: 'rgba(255, 255, 255, 0.9)',
                                transform: 'scale(1.1)'
                            }
                        }}
                    >
                        <MicIcon />
                    </IconButton>

                    <IconButton
                        onClick={() => setShowScheduler(!showScheduler)}
                        sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                color: 'rgba(255, 255, 255, 0.9)',
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
                                color: 'rgba(255, 255, 255, 0.9)',
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
                        variant="standard"
                        sx={{
                            input: {
                                color: 'rgba(255, 255, 255, 0.9)',
                                '&::placeholder': {
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    opacity: 1
                                }
                            },
                            '& .MuiInput-underline:before': {
                                borderBottomColor: 'rgba(255, 255, 255, 0.1)'
                            },
                            '& .MuiInput-underline:hover:before': {
                                borderBottomColor: 'rgba(255, 255, 255, 0.2)'
                            },
                            '& .MuiInput-underline:after': {
                                borderBottomColor: 'rgba(255, 255, 255, 0.3)'
                            }
                        }}
                    />

                    <IconButton
                        type="submit"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                color: 'rgba(255, 255, 255, 0.9)',
                                transform: 'scale(1.1)'
                            }
                        }}
                    >
                        <SendIcon />
                    </IconButton>
                </Paper>
            </Box>

            {/* Right floating box - User profile and settings */}
            <Box
                sx={{
                    width: { xs: '100%', md: 280 },
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    gap: 2,
                    height: 'calc(100vh - 48px)',
                    backdropFilter: 'blur(20px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: `
                        0 4px 24px -1px rgba(0, 0, 0, 0.2),
                        0 0 16px -2px rgba(0, 0, 0, 0.1),
                        0 0 1px 0 rgba(255, 255, 255, 0.2) inset,
                        0 0 15px 0 rgba(255, 255, 255, 0.05)
                    `,
                    position: 'relative',
                    overflow: 'hidden',
                    padding: 3,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                        pointerEvents: 'none'
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: -200,
                        left: -200,
                        right: -200,
                        height: '200%',
                        background: 'linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 48%, rgba(255,255,255,0.1) 52%, transparent 55%)',
                        animation: 'shine 8s infinite',
                        transform: 'rotate(35deg)',
                        pointerEvents: 'none'
                    }
                }}
            >
                {/* User profile section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <ProfilePicture size={120} />
                    <Typography variant="h6" sx={{ color: 'white' }}>{user?.username}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            onClick={handleProfileSettings}
                            sx={{
                                backdropFilter: 'blur(20px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                }
                            }}
                        >
                            Settings
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleLogout}
                            sx={{
                                backdropFilter: 'blur(20px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                }
                            }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Box>

                {/* Online users section */}
                <Box
                    sx={{
                        mt: 3,
                        flex: 1,
                        overflowY: 'auto',
                        backdropFilter: 'blur(20px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        p: 2
                    }}
                >
                    <Typography variant="subtitle1" sx={{ color: 'white', mb: 2 }}>Online Users</Typography>
                    <List>
                        {onlineUsers.map(user => (
                            <ListItem key={user.id}>
                                <ListItemAvatar>
                                    <Avatar src={user.avatar} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={user.username}
                                    sx={{ color: 'white' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Box>

            {/* GIF Picker Dialog */}
            <Dialog
                open={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                maxWidth="md"
                PaperProps={{
                    sx: {
                        backdropFilter: 'blur(25px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle>Select a GIF</DialogTitle>
                <DialogContent>
                    <GifPicker onSelect={handleGifSelect} />
                </DialogContent>
            </Dialog>

            {/* Voice Message Dialog */}
            <Dialog
                open={showVoiceMessage}
                onClose={() => setShowVoiceMessage(false)}
                PaperProps={{
                    sx: {
                        backdropFilter: 'blur(25px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                    }
                }}
            >
                <DialogTitle>Record Voice Message</DialogTitle>
                <DialogContent>
                    <VoiceMessage onComplete={handleVoiceMessageComplete} />
                </DialogContent>
            </Dialog>

            {/* Message Scheduler Dialog */}
            <Dialog
                open={showScheduler}
                onClose={() => setShowScheduler(false)}
                PaperProps={{
                    sx: {
                        backdropFilter: 'blur(25px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                    }
                }}
            >
                <DialogTitle>Schedule Message</DialogTitle>
                <DialogContent>
                    <MessageScheduler onSchedule={handleScheduleMessage} />
                </DialogContent>
            </Dialog>

            {/* Vanishing Message Timer Menu */}
            <Menu
                anchorEl={messageSettingsAnchor}
                open={Boolean(messageSettingsAnchor)}
                onClose={() => setMessageSettingsAnchor(null)}
                PaperProps={{
                    sx: {
                        backdropFilter: 'blur(25px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        '& .MuiMenuItem-root': {
                            color: 'rgba(255, 255, 255, 0.9)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }}
            >
                <MenuItem onClick={() => handleVanishTimeSelect(null)}>
                    <ListItemIcon><TimerIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} /></ListItemIcon>
                    <ListItemText>No Auto-Delete</ListItemText>
                    {!messageVanishTime && <CheckIcon sx={{ ml: 2, color: 'rgba(255, 255, 255, 0.7)' }} />}
                </MenuItem>
                {[1, 5, 10, 30, 60].map(minutes => (
                    <MenuItem key={minutes} onClick={() => handleVanishTimeSelect(minutes)}>
                        <ListItemIcon><TimerIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} /></ListItemIcon>
                        <ListItemText>{minutes} minute{minutes !== 1 ? 's' : ''}</ListItemText>
                        {messageVanishTime === minutes && <CheckIcon sx={{ ml: 2, color: 'rgba(255, 255, 255, 0.7)' }} />}
                    </MenuItem>
                ))}
            </Menu>

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '16px',
                        zIndex: 9999,
                        transform: 'translateY(-8px)',
                        '& em-emoji-picker': {
                            '--background-rgb': '17, 25, 40',
                            '--border-radius': '16px',
                            '--category-icon-size': '24px',
                            '--font-family': 'inherit',
                            '--rgb-accent': '255, 255, 255',
                            '--rgb-background': '17, 25, 40',
                            '--rgb-color': '255, 255, 255',
                            '--rgb-input': '255, 255, 255',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(25px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                            backgroundColor: 'rgba(17, 25, 40, 0.8)'
                        }
                    }}
                >
                    <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme={theme.mode}
                    />
                </Box>
            )}

            {/* New Room Dialog */}
            <NewRoomDialog
                open={showNewRoomDialog}
                onClose={() => setShowNewRoomDialog(false)}
                onCreateRoom={handleCreateRoom}
            />

            {/* Room Settings Dialog */}
            <RoomSettings
                open={showRoomSettings}
                onClose={() => setShowRoomSettings(false)}
                room={activeRoomDetails}
                onUpdateTopic={handleUpdateTopic}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onPromoteToAdmin={handlePromoteToAdmin}
                onDemoteFromAdmin={handleDemoteFromAdmin}
            />
        </Box>
    );
} 