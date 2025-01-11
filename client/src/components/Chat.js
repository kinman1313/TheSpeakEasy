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
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Fetched rooms:', data); // Debug log
                setRooms(data.rooms || []);

                // Join public lobby by default
                if (data.rooms?.length > 0) {
                    const publicLobby = data.rooms.find(room => room.name === 'public-lobby');
                    if (publicLobby) {
                        setActiveRoom(publicLobby.id);
                        socket.emit('join_room', publicLobby.id);
                    }
                }
            } catch (error) {
                console.error('Error fetching rooms:', error);
                // Set default public lobby if fetch fails
                setRooms([{
                    id: 'public-lobby',
                    name: 'Public Lobby',
                    topic: 'Welcome to the chat!',
                    isPrivate: false
                }]);
            }
        };

        if (socket) {
            fetchRooms();
        }
    }, [socket]);

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

                    const updatedMessages = [...prevMessages, {
                        _id: newMessage._id || Date.now(),
                        ...newMessage
                    }];

                    console.log('Updated messages:', updatedMessages);
                    return updatedMessages;
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

    const handleGifSelect = (gifData) => {
        if (!gifData || !gifData.content) {
            console.error('Invalid GIF data');
            return;
        }

        handleSendMessage(gifData.content, 'gif', gifData.metadata);
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
        if (!socket) {
            console.error('Cannot send message: socket not connected');
            return;
        }

        if (!content) {
            console.error('Cannot send message: empty content');
            return;
        }

        const roomId = activeRoom || 'public-lobby';
        if (!roomId) {
            console.error('Cannot send message: no active room selected');
            return;
        }

        const message = {
            type,
            content,
            metadata: {
                ...metadata,
                vanishTime: messageVanishTime
            },
            sender: user.username,
            roomId,
            timestamp: new Date().toISOString()
        };

        console.log('Sending message:', message); // Debug log

        // Add message to local state first
        setMessages(prevMessages => [...prevMessages, {
            _id: Date.now(),
            ...message
        }]);

        // Then emit to socket
        socket.emit('message', message, (error) => {
            if (error) {
                console.error('Error sending message:', error);
                // Remove message from local state if there was an error
                setMessages(prevMessages => prevMessages.filter(msg =>
                    msg.timestamp !== message.timestamp ||
                    msg.sender !== message.sender
                ));
            } else {
                console.log('Message sent successfully');
                // Clear input if it's a text message
                if (type === 'text' && messageInputRef.current) {
                    messageInputRef.current.value = '';
                }
            }
        });
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

            const newText = before + emojiChar + after;
            messageInputRef.current.value = newText;
            const newCursorPos = start + emojiChar.length;
            messageInputRef.current.selectionStart = newCursorPos;
            messageInputRef.current.selectionEnd = newCursorPos;
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

    // Update the message rendering
    const renderMessage = (message) => {
        switch (message.type) {
            case 'gif':
                return (
                    <Box
                        component="img"
                        src={message.content}
                        alt="GIF"
                        sx={{
                            maxWidth: '300px',
                            maxHeight: '300px',
                            borderRadius: 2,
                            objectFit: 'contain'
                        }}
                    />
                );
            case 'voice':
                return (
                    <audio controls>
                        <source src={message.content} type="audio/webm" />
                        Your browser does not support the audio element.
                    </audio>
                );
            default:
                return message.content;
        }
    };

    // Update the messages container styling
    <Box
        ref={messagesContainerRef}
        sx={{
            flexGrow: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 2,
            '&::-webkit-scrollbar': {
                width: '8px',
            },
            '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                '&:hover': {
                    background: 'rgba(255, 255, 255, 0.4)',
                },
            },
        }}
    >
        {messages.map((message, index) => (
            <Box
                key={message._id || index}
                sx={{
                    alignSelf: message.sender === user.username ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    position: 'relative'
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        backgroundColor: message.sender === user.username
                            ? 'rgba(25, 118, 210, 0.6)'
                            : 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.125)',
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
                            pointerEvents: 'none'
                        }
                    }}
                >
                    {renderMessage(message)}
                </Paper>
                <Typography
                    variant="caption"
                    sx={{
                        mt: 0.5,
                        color: 'rgba(255, 255, 255, 0.7)',
                        textAlign: message.sender === user.username ? 'right' : 'left'
                    }}
                >
                    {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
            </Box>
        ))}
    </Box>

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                minHeight: '100vh',
                maxHeight: '100vh',
                padding: { xs: 0, md: 3 },
                gap: { xs: 0, md: 3 },
                background: `
                    linear-gradient(135deg, rgba(17, 25, 40, 0.7) 0%, rgba(31, 38, 135, 0.7) 100%),
                    radial-gradient(at 50% 0%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%),
                    radial-gradient(at 50% 100%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)
                `,
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Mobile AppBar with enhanced glass effect */}
            <AppBar
                position="fixed"
                sx={{
                    display: { md: 'none' },
                    backdropFilter: 'blur(20px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                    backgroundColor: 'rgba(17, 25, 40, 0.5)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                        pointerEvents: 'none'
                    }
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, color: 'white' }}>
                        {activeRoomDetails?.name || 'Chat'}
                    </Typography>
                    <IconButton
                        color="inherit"
                        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                    >
                        <AccountIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Mobile Drawer with enhanced glass effect */}
            <Drawer
                variant="temporary"
                anchor="left"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: '80%',
                        maxWidth: '360px',
                        backdropFilter: 'blur(20px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                        backgroundColor: 'rgba(17, 25, 40, 0.6)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                            pointerEvents: 'none'
                        }
                    }
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Messages container with enhanced glass effect */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: { xs: 'calc(100vh - 56px)', md: 'calc(100vh - 48px)' },
                    mt: { xs: '56px', md: 0 },
                    backdropFilter: 'blur(20px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: { xs: '0', md: '24px' },
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                        pointerEvents: 'none'
                    }
                }}
            >
                {/* Messages area with enhanced scrollbar */}
                <Box
                    ref={messagesContainerRef}
                    sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        p: 2,
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.4)',
                            },
                        },
                    }}
                >
                    {messages.map((message, index) => (
                        <Box
                            key={message._id || index}
                            sx={{
                                alignSelf: message.sender === user.username ? 'flex-end' : 'flex-start',
                                maxWidth: '70%',
                                position: 'relative'
                            }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    backgroundColor: message.sender === user.username
                                        ? 'rgba(25, 118, 210, 0.6)'
                                        : 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: 2,
                                    border: '1px solid rgba(255, 255, 255, 0.125)',
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
                                        pointerEvents: 'none'
                                    }
                                }}
                            >
                                {renderMessage(message)}
                            </Paper>
                            <Typography
                                variant="caption"
                                sx={{
                                    mt: 0.5,
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    textAlign: message.sender === user.username ? 'right' : 'left'
                                }}
                            >
                                {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Message input area with enhanced glass effect */}
                <Paper
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    sx={{
                        p: { xs: 1, md: 2 },
                        m: { xs: 1, md: 2 },
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        backdropFilter: 'blur(20px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
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

            {/* Hide the right box on mobile */}
            <Box
                sx={{
                    width: { xs: '100%', md: 280 },
                    display: { xs: 'none', md: 'flex' }
                }}
            >
                {/* Right floating box - User profile and settings */}
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
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
            </Box>

            {/* GIF Picker Dialog */}
            <Dialog
                open={showGifPicker}
                onClose={() => setShowGifPicker(false)}
                maxWidth="md"
                keepMounted={false}
                disablePortal={false}
                PaperProps={{
                    sx: {
                        backdropFilter: 'blur(25px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        overflow: 'hidden'
                    },
                    role: 'dialog',
                    'aria-modal': 'true'
                }}
                slotProps={{
                    backdrop: {
                        sx: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
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
                keepMounted={false}
                disablePortal={false}
                PaperProps={{
                    sx: {
                        backdropFilter: 'blur(25px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(25px) saturate(200%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                    },
                    role: 'dialog',
                    'aria-modal': 'true'
                }}
                slotProps={{
                    backdrop: {
                        sx: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
                    }
                }}
            >
                <DialogTitle>Record Voice Message</DialogTitle>
                <DialogContent>
                    <VoiceMessage onComplete={handleVoiceMessageComplete} />
                </DialogContent>
            </Dialog>

            {/* Message Scheduler Dialog */}
            {showScheduler && (
                <Dialog
                    open={showScheduler}
                    onClose={() => setShowScheduler(false)}
                    aria-labelledby="scheduler-dialog-title"
                    keepMounted={false}
                    disablePortal={false}
                    PaperProps={{
                        sx: {
                            backgroundColor: 'rgba(17, 25, 40, 0.8)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.125)',
                            borderRadius: 2,
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                        }
                    }}
                >
                    <DialogTitle id="scheduler-dialog-title">Schedule Message</DialogTitle>
                    <DialogContent>
                        <MessageScheduler
                            onSchedule={handleScheduleMessage}
                            onClose={() => setShowScheduler(false)}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Vanishing Message Timer Menu */}
            <Menu
                anchorEl={messageSettingsAnchor}
                open={Boolean(messageSettingsAnchor)}
                onClose={() => setMessageSettingsAnchor(null)}
                keepMounted={false}
                disablePortal={false}
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
                    },
                    role: 'menu',
                    'aria-label': 'Message vanish timer options'
                }}
                slotProps={{
                    backdrop: {
                        sx: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
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
                        position: 'fixed',
                        bottom: { xs: '70px', md: '80px' },
                        left: { xs: '0px', md: '16px' },
                        right: { xs: '0px', md: 'auto' },
                        zIndex: 1250,
                        transform: 'none',
                        '& em-emoji-picker': {
                            width: '100% !important',
                            height: '300px !important',
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
                    <div onMouseDown={(e) => e.preventDefault()}>
                        <Picker
                            data={data}
                            onEmojiSelect={handleEmojiSelect}
                            theme={theme.mode}
                            onClickOutside={() => setShowEmojiPicker(false)}
                        />
                    </div>
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