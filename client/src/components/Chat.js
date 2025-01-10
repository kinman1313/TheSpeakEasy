import React, { useState, useEffect, useRef } from 'react';
import { Box, Drawer, IconButton, Divider, Typography, Avatar, Menu, MenuItem, Tooltip, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, ListItemIcon, Switch } from '@mui/material';
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
    Check as CheckIcon
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

const drawerWidth = 280;

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

    // Add missing state variables
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [showScheduler, setShowScheduler] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const messageInputRef = useRef(null);

    useEffect(() => {
        if (socket) {
            // Connect to the socket and join public lobby
            socket.connect();
            socket.emit('join', 'public-lobby');

            // Handle incoming messages
            socket.on('message', (newMessage) => {
                console.log('Received message:', newMessage); // Debug log
                setMessages(prevMessages => [...prevMessages, {
                    _id: Date.now(), // Ensure unique ID
                    ...newMessage,
                    timestamp: new Date().toISOString()
                }]);
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

        setMessages(prevMessages => [...prevMessages, {
            _id: Date.now(),
            ...message
        }]);
        scrollToBottom();
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const messageText = messageInputRef.current?.value?.trim();
        if (messageText) {
            handleSendMessage(messageText);
            messageInputRef.current.value = '';
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

    return (
        <Box sx={{
            display: 'flex',
            height: '100vh',
            background: 'linear-gradient(135deg, #0a1929 0%, #1a2b3c 100%)',
            color: 'white',
            position: 'relative',
            overscrollBehavior: 'none', // Prevent overscroll
            WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at top left, rgba(243, 215, 127, 0.1), transparent 40%), radial-gradient(circle at bottom right, rgba(243, 215, 127, 0.05), transparent 30%)',
                pointerEvents: 'none'
            }
        }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: 'rgba(10, 25, 41, 0.85)',
                        backdropFilter: 'blur(10px)',
                        borderRight: '1px solid rgba(243, 215, 127, 0.1)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, rgba(243, 215, 127, 0.2), transparent)'
                        }
                    }
                }}
            >
                <Box sx={{
                    p: 2,
                    background: 'linear-gradient(180deg, rgba(243, 215, 127, 0.1), transparent)',
                    borderBottom: '1px solid rgba(243, 215, 127, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            src={user?.avatarUrl}
                            sx={{
                                bgcolor: 'rgba(243, 215, 127, 0.2)',
                                border: '2px solid rgba(243, 215, 127, 0.3)',
                                color: '#f3d77f',
                                boxShadow: '0 0 10px rgba(243, 215, 127, 0.2)',
                                cursor: 'pointer'
                            }}
                            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                        >
                            {user?.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="subtitle1" sx={{
                            color: '#f3d77f',
                            textShadow: '0 0 10px rgba(243, 215, 127, 0.3)'
                        }}>
                            {user?.username}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                        sx={{
                            color: '#f3d77f',
                            '&:hover': {
                                bgcolor: 'rgba(243, 215, 127, 0.1)',
                                backdropFilter: 'blur(5px)'
                            }
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Menu
                        anchorEl={userMenuAnchor}
                        open={Boolean(userMenuAnchor)}
                        onClose={() => setUserMenuAnchor(null)}
                        PaperProps={{
                            sx: {
                                bgcolor: 'rgba(10, 25, 41, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(243, 215, 127, 0.1)',
                                boxShadow: '0 4px 32px rgba(0, 0, 0, 0.2)',
                                '& .MuiMenuItem-root': {
                                    color: 'white',
                                    gap: 1.5,
                                    '&:hover': {
                                        bgcolor: 'rgba(243, 215, 127, 0.1)'
                                    }
                                }
                            }
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <MenuItem onClick={handleProfileSettings}>
                            <AccountIcon sx={{ color: '#f3d77f' }} />
                            Profile Settings
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon sx={{ color: '#f3d77f' }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>

                <Typography variant="h6" sx={{ p: 2, color: '#f3d77f' }}>Online Users</Typography>
                <List>
                    {onlineUsers.map((user) => (
                        <ListItem key={user.id} disablePadding>
                            <ListItemButton
                                sx={{
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        bgcolor: 'rgba(243, 215, 127, 0.1)',
                                        backdropFilter: 'blur(5px)'
                                    }
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{
                                        bgcolor: 'rgba(243, 215, 127, 0.2)',
                                        border: '2px solid rgba(243, 215, 127, 0.3)',
                                        color: '#f3d77f',
                                        boxShadow: '0 0 10px rgba(243, 215, 127, 0.2)'
                                    }}>
                                        {user.username[0].toUpperCase()}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={user.username}
                                    sx={{
                                        '& .MuiListItemText-primary': {
                                            color: 'rgba(255, 255, 255, 0.9)'
                                        }
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    position: 'relative',
                    bgcolor: 'rgba(10, 25, 41, 0.7)',
                    backdropFilter: 'blur(10px)',
                    overscrollBehavior: 'none', // Prevent overscroll
                    WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(243, 215, 127, 0.2), transparent)'
                    }
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
                        overscrollBehavior: 'contain', // Prevent overscroll
                        WebkitOverflowScrolling: 'touch', // Enable smooth scrolling on iOS
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(243, 215, 127, 0.3) rgba(255, 255, 255, 0.05)',
                        msOverflowStyle: 'none', // Hide scrollbar in IE/Edge
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(243, 215, 127, 0.3)',
                            borderRadius: '4px',
                            border: '2px solid rgba(243, 215, 127, 0.1)',
                            backdropFilter: 'blur(5px)',
                            '&:hover': {
                                background: 'rgba(243, 215, 127, 0.4)'
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
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </Box>

                <Paper
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        p: 2,
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        bgcolor: 'rgba(10, 25, 41, 0.85)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        boxShadow: '0 4px 32px rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(243, 215, 127, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '1px',
                            background: 'linear-gradient(90deg, transparent, rgba(243, 215, 127, 0.2), transparent)'
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', gap: 1, p: 2, borderTop: '1px solid rgba(243, 215, 127, 0.1)' }}>
                        <IconButton
                            onClick={() => setShowEmojiPicker(true)}
                            sx={{
                                color: showEmojiPicker ? '#f3d77f' : 'rgba(243, 215, 127, 0.7)',
                                '&:hover': { bgcolor: 'rgba(243, 215, 127, 0.1)' }
                            }}
                        >
                            <EmojiIcon />
                        </IconButton>

                        <IconButton
                            onClick={() => setShowGifPicker(true)}
                            sx={{
                                color: showGifPicker ? '#f3d77f' : 'rgba(243, 215, 127, 0.7)',
                                '&:hover': { bgcolor: 'rgba(243, 215, 127, 0.1)' }
                            }}
                        >
                            <GifIcon />
                        </IconButton>

                        <IconButton
                            onClick={handleVoiceMessageStart}
                            sx={{
                                color: showVoiceMessage ? '#f3d77f' : 'rgba(243, 215, 127, 0.7)',
                                '&:hover': { bgcolor: 'rgba(243, 215, 127, 0.1)' }
                            }}
                        >
                            <MicIcon />
                        </IconButton>

                        <IconButton
                            onClick={(e) => setMessageSettingsAnchor(e.currentTarget)}
                            sx={{
                                color: messageVanishTime ? '#f3d77f' : 'rgba(243, 215, 127, 0.7)',
                                '&:hover': { bgcolor: 'rgba(243, 215, 127, 0.1)' }
                            }}
                        >
                            <TimerIcon />
                        </IconButton>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, gap: '8px' }}>
                            <TextField
                                inputRef={messageInputRef}
                                fullWidth
                                placeholder="Type a message..."
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                                        '&:hover': {
                                            bgcolor: 'rgba(255, 255, 255, 0.08)',
                                        },
                                        '& fieldset': {
                                            borderColor: 'rgba(243, 215, 127, 0.2)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(243, 215, 127, 0.3)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#f3d77f',
                                        },
                                    },
                                }}
                            />
                            <IconButton
                                type="submit"
                                sx={{
                                    color: '#f3d77f',
                                    '&:hover': { bgcolor: 'rgba(243, 215, 127, 0.1)' }
                                }}
                            >
                                <SendIcon />
                            </IconButton>
                        </form>
                    </Box>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <Box sx={{
                            position: 'absolute',
                            bottom: '80px',
                            right: '16px',
                            zIndex: 1000
                        }}>
                            <Paper sx={{
                                bgcolor: 'rgba(10, 25, 41, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(243, 215, 127, 0.1)',
                            }}>
                                <Picker
                                    data={data}
                                    onEmojiSelect={handleEmojiSelect}
                                    theme="dark"
                                    previewPosition="none"
                                />
                            </Paper>
                        </Box>
                    )}

                    {/* GIF Picker */}
                    {showGifPicker && (
                        <Dialog
                            open={showGifPicker}
                            onClose={() => setShowGifPicker(false)}
                            maxWidth="md"
                            PaperProps={{
                                sx: {
                                    bgcolor: 'rgba(10, 25, 41, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(243, 215, 127, 0.1)',
                                }
                            }}
                        >
                            <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
                        </Dialog>
                    )}

                    {/* Voice Message */}
                    {showVoiceMessage && (
                        <Dialog
                            open={showVoiceMessage}
                            onClose={() => setShowVoiceMessage(false)}
                            PaperProps={{
                                sx: {
                                    bgcolor: 'rgba(10, 25, 41, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(243, 215, 127, 0.1)',
                                }
                            }}
                        >
                            <VoiceMessage
                                onSend={handleVoiceMessageComplete}
                                onClose={() => setShowVoiceMessage(false)}
                            />
                        </Dialog>
                    )}

                    {/* Message Settings Menu */}
                    <Menu
                        anchorEl={messageSettingsAnchor}
                        open={Boolean(messageSettingsAnchor)}
                        onClose={() => setMessageSettingsAnchor(null)}
                        PaperProps={{
                            sx: {
                                bgcolor: 'rgba(10, 25, 41, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(243, 215, 127, 0.1)',
                                color: 'white'
                            }
                        }}
                    >
                        <MenuItem onClick={() => handleVanishTimeSelect(null)}>
                            <ListItemIcon>
                                {!messageVanishTime && <CheckIcon sx={{ color: '#f3d77f' }} />}
                            </ListItemIcon>
                            Never
                        </MenuItem>
                        {[1, 5, 10, 30, 60].map(minutes => (
                            <MenuItem key={minutes} onClick={() => handleVanishTimeSelect(minutes)}>
                                <ListItemIcon>
                                    {messageVanishTime === minutes && <CheckIcon sx={{ color: '#f3d77f' }} />}
                                </ListItemIcon>
                                {minutes} {minutes === 1 ? 'minute' : 'minutes'}
                            </MenuItem>
                        ))}
                    </Menu>

                    {/* Notification Settings Dialog */}
                    <Dialog
                        open={showNotificationSettings}
                        onClose={() => setShowNotificationSettings(false)}
                        PaperProps={{
                            sx: {
                                bgcolor: 'rgba(10, 25, 41, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(243, 215, 127, 0.1)',
                            }
                        }}
                    >
                        <DialogTitle sx={{ color: '#f3d77f' }}>Notification Settings</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ color: 'white' }}>Sound</Typography>
                                    <Switch
                                        checked={notificationSound}
                                        onChange={(e) => handleNotificationSettingsChange('sound', e.target.checked)}
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#f3d77f' } }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ color: 'white' }}>Desktop Notifications</Typography>
                                    <Switch
                                        checked={desktopNotifications}
                                        onChange={(e) => handleNotificationSettingsChange('desktop', e.target.checked)}
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#f3d77f' } }}
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                    </Dialog>
                </Paper>
            </Box>

            {showProfileSettings && (
                <Dialog
                    open={showProfileSettings}
                    onClose={() => setShowProfileSettings(false)}
                    PaperProps={{
                        sx: {
                            bgcolor: 'rgba(10, 25, 41, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(243, 215, 127, 0.1)',
                            boxShadow: '0 4px 32px rgba(0, 0, 0, 0.2)',
                            color: 'white',
                            minWidth: 400
                        }
                    }}
                >
                    <DialogTitle sx={{
                        borderBottom: '1px solid rgba(243, 215, 127, 0.1)',
                        color: '#f3d77f'
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
                                            borderColor: 'rgba(243, 215, 127, 0.3)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(243, 215, 127, 0.5)'
                                        }
                                    }
                                }}
                                InputLabelProps={{
                                    sx: { color: 'rgba(243, 215, 127, 0.7)' }
                                }}
                            />
                            <TextField
                                label="Email"
                                value={user?.email || ''}
                                InputProps={{
                                    sx: {
                                        color: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(243, 215, 127, 0.3)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(243, 215, 127, 0.5)'
                                        }
                                    }
                                }}
                                InputLabelProps={{
                                    sx: { color: 'rgba(243, 215, 127, 0.7)' }
                                }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ borderTop: '1px solid rgba(243, 215, 127, 0.1)', p: 2 }}>
                        <Button
                            onClick={() => setShowProfileSettings(false)}
                            sx={{
                                color: 'rgba(243, 215, 127, 0.7)',
                                '&:hover': {
                                    bgcolor: 'rgba(243, 215, 127, 0.1)'
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            sx={{
                                bgcolor: 'rgba(243, 215, 127, 0.2)',
                                color: '#f3d77f',
                                '&:hover': {
                                    bgcolor: 'rgba(243, 215, 127, 0.3)'
                                }
                            }}
                        >
                            Save Changes
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
} 