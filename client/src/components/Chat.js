import React, { useState, useEffect, useRef } from 'react';
import { Box, Drawer, IconButton, Divider, Typography, Avatar, Menu, MenuItem, Tooltip, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, ListItemIcon, Switch, AppBar, Toolbar } from '@mui/material';
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
    Search as SearchIcon
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

    // Add drawer content component
    const drawerContent = (
        <>
            <Box sx={{
                p: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.125)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Chats</Typography>
                    <IconButton
                        onClick={() => setIsNewChatOpen(true)}
                        sx={{ color: 'white' }}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
                <TextField
                    placeholder="Search users or rooms..."
                    size="small"
                    fullWidth
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.5)' }} />,
                        sx: { color: 'white' }
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.125)' }
                        }
                    }}
                />
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto' }}>
                <ListSubheader sx={{ bgcolor: 'transparent', color: 'white', fontWeight: 600 }}>
                    Public Rooms
                </ListSubheader>
                {rooms.map((room) => (
                    <ListItem key={room.id} disablePadding>
                        <ListItemButton
                            selected={activeRoom?.id === room.id}
                            onClick={() => handleRoomSelect(room)}
                            sx={{
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)' }
                                }
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    {room.name[0].toUpperCase()}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={room.name}
                                secondary={room.topic || 'No topic set'}
                                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}

                <ListSubheader sx={{ bgcolor: 'transparent', color: 'white', fontWeight: 600, mt: 2 }}>
                    Direct Messages
                </ListSubheader>
                {onlineUsers.map((user) => (
                    <ListItem key={user.id} disablePadding>
                        <ListItemButton onClick={() => handleStartDM(user)}>
                            <ListItemAvatar>
                                <Avatar src={user.avatarUrl}>
                                    {user.username[0].toUpperCase()}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={user.username}
                                secondary={user.status || 'Online'}
                                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </>
    );

    return (
        <Box sx={{
            display: 'flex',
            height: '100vh',
            background: '#1a1a40',
            backgroundImage: `
                radial-gradient(at 47% 33%, hsl(206.25, 35%, 36%) 0, transparent 59%), 
                radial-gradient(at 82% 65%, hsl(120.00, 34%, 29%) 0, transparent 55%)
            `,
            color: 'white',
            position: 'relative',
            overscrollBehavior: 'none'
        }}>
            {/* Mobile app bar */}
            <AppBar
                position="fixed"
                sx={{
                    display: { sm: 'none' },
                    bgcolor: 'rgba(17, 25, 40, 0.75)',
                    backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.125)'
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        TheSpeakEasy
                    </Typography>
                    <IconButton
                        color="inherit"
                        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                    >
                        <Avatar
                            src={user?.avatarUrl}
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                border: '2px solid rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            {user?.username?.[0]?.toUpperCase()}
                        </Avatar>
                    </IconButton>
                </Toolbar>
            </AppBar>

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
        </Box>
    );
} 