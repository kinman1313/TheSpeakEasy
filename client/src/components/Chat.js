import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import {
    Container,
    Paper,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Drawer,
    List as MUIList,
    ListItem as MUIListItem,
    ListItemIcon,
    ListItemText as MUIListItemText,
    Divider
} from '@mui/material';
import {
    Menu as MenuIcon,
    Send as SendIcon,
    ExitToApp as LogoutIcon,
    Person as PersonIcon,
    Gif as GifIcon,
    Mic as MicIcon,
    Schedule as ScheduleIcon,
    EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { io } from 'socket.io-client';
import TypingIndicator from './TypingIndicator';
import MessageReactions from './MessageReactions';
import MessageThread from './MessageThread';
import GifPicker from './GifPicker';
import VoiceMessage from './VoiceMessage';
import MessageScheduler from './MessageScheduler';
import UserProfile from './UserProfile';

const drawerWidth = 240;

export default function Chat() {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [users, setUsers] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showVoiceMessage, setShowVoiceMessage] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const typingTimeoutRef = useRef(null);
    const [drawerOpen, setDrawerOpen] = useState(window.innerWidth >= 600);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 600;
            setIsMobile(mobile);
            if (!mobile && !drawerOpen) {
                setDrawerOpen(true);
            } else if (mobile && drawerOpen) {
                setDrawerOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [drawerOpen]);

    useEffect(() => {
        const newSocket = io(config.SOCKET_URL, {
            withCredentials: true
        });
        setSocket(newSocket);

        // Join chat with authenticated username
        newSocket.emit('join', user.username);

        newSocket.on('message', (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        newSocket.on('userJoined', (userData) => {
            const username = typeof userData === 'string' ? userData : userData.username;
            setUsers(prev => {
                if (!prev.includes(username)) {
                    return [...prev, username];
                }
                return prev;
            });
        });

        newSocket.on('userLeft', (userData) => {
            const username = typeof userData === 'string' ? userData : userData.username;
            setUsers(prev => prev.filter(u => u !== username));
        });

        newSocket.on('typing', (username) => {
            setTypingUsers(prev => {
                if (!prev.includes(username)) {
                    return [...prev, username];
                }
                return prev;
            });
        });

        newSocket.on('stopTyping', (username) => {
            setTypingUsers(prev => prev.filter(u => u !== username));
        });

        newSocket.on('reaction', ({ messageId, emoji, userId, type }) => {
            setMessages(messages => messages.map(msg => {
                if (msg.id === messageId) {
                    const reactions = msg.reactions || [];
                    if (type === 'add') {
                        const existingReaction = reactions.find(r => r.emoji === emoji);
                        if (existingReaction) {
                            existingReaction.count++;
                            existingReaction.users.push(userId);
                        } else {
                            reactions.push({ emoji, count: 1, users: [userId] });
                        }
                    } else if (type === 'remove') {
                        const existingReaction = reactions.find(r => r.emoji === emoji);
                        if (existingReaction) {
                            existingReaction.count--;
                            existingReaction.users = existingReaction.users.filter(id => id !== userId);
                            if (existingReaction.count <= 0) {
                                return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
                            }
                        }
                    }
                    return { ...msg, reactions };
                }
                return msg;
            }));
        });

        return () => newSocket.close();
    }, [user.username]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const emitTyping = () => {
        if (socket) {
            socket.emit('typing', { username: user.username });

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', { username: user.username });
            }, 1000);
        }
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        emitTyping();
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageInput.trim() && socket) {
            socket.emit('message', messageInput);
            setMessageInput('');
            socket.emit('stopTyping', { username: user.username });
        }
    };

    const handleGifSelect = (gif) => {
        if (socket) {
            socket.emit('message', `[GIF] ${gif.url}`);
            setShowGifPicker(false);
        }
    };

    const handleVoiceMessage = (audioUrl) => {
        if (socket) {
            socket.emit('message', `[VOICE] ${audioUrl}`);
        }
    };

    const handleScheduleMessage = (scheduleData) => {
        setScheduledMessages(prev => [...prev, scheduleData]);
        // Here you would typically also send this to the server
    };

    const handleAddReaction = (messageId, emoji) => {
        if (socket) {
            socket.emit('reaction', { messageId, emoji, type: 'add' });
            // Optimistically update the UI
            setMessages(messages => messages.map(msg => {
                if (msg.id === messageId) {
                    const reactions = msg.reactions || [];
                    const existingReaction = reactions.find(r => r.emoji === emoji);
                    if (existingReaction) {
                        existingReaction.count++;
                        existingReaction.users.push(user.id);
                    } else {
                        reactions.push({ emoji, count: 1, users: [user.id] });
                    }
                    return { ...msg, reactions };
                }
                return msg;
            }));
        }
    };

    const handleRemoveReaction = (messageId, emoji) => {
        if (socket) {
            socket.emit('reaction', { messageId, emoji, type: 'remove' });
            // Optimistically update the UI
            setMessages(messages => messages.map(msg => {
                if (msg.id === messageId) {
                    const reactions = msg.reactions || [];
                    const existingReaction = reactions.find(r => r.emoji === emoji);
                    if (existingReaction) {
                        existingReaction.count--;
                        existingReaction.users = existingReaction.users.filter(id => id !== user.id);
                        if (existingReaction.count <= 0) {
                            return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
                        }
                    }
                    return { ...msg, reactions };
                }
                return msg;
            }));
        }
    };

    const handleLogout = async () => {
        try {
            if (socket) {
                socket.disconnect();
            }
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* App Bar */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Chat Room
                    </Typography>
                    <IconButton color="inherit" onClick={() => setShowProfile(!showProfile)}>
                        <PersonIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Side Drawer for Online Users */}
            <Drawer
                variant={window.innerWidth < 600 ? 'temporary' : 'permanent'}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                    display: { xs: drawerOpen ? 'block' : 'none', sm: 'block' }
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        <ListItem>
                            <Typography variant="subtitle1" color="primary">
                                Online Users ({users.length})
                            </Typography>
                        </ListItem>
                        {users.map((username, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    <PersonIcon />
                                </ListItemIcon>
                                <ListItemText primary={username} />
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        <ListItem button onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* Main Chat Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: 8, // Add margin top to account for AppBar
                    width: {
                        xs: '100%',
                        sm: `calc(100% - ${drawerWidth}px)`
                    },
                    marginLeft: {
                        xs: 0,
                        sm: `${drawerWidth}px`
                    },
                    marginRight: showProfile ? '300px' : 0,
                    transition: 'margin 0.3s ease-in-out'
                }}
            >
                <Box sx={{ height: 'calc(100vh - 180px)', overflow: 'auto', mb: 2 }}>
                    {messages.map((message, index) => (
                        <MessageThread
                            key={index}
                            message={{
                                ...message,
                                id: index,
                                user: {
                                    id: message.username,
                                    username: message.username,
                                    avatar: null
                                }
                            }}
                            replies={[]}
                            onReply={(reply) => {
                                if (socket) {
                                    socket.emit('message', `@${message.username} ${reply.text}`);
                                }
                            }}
                            onAddReaction={handleAddReaction}
                            onRemoveReaction={handleRemoveReaction}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Message Input Area */}
                <Box sx={{
                    position: 'fixed',
                    bottom: 0,
                    right: showProfile ? 300 : 0,
                    left: drawerWidth,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider'
                }}>
                    {typingUsers.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                            <TypingIndicator users={typingUsers} />
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <IconButton onClick={() => setShowGifPicker(!showGifPicker)} title="Send GIF">
                            <GifIcon />
                        </IconButton>
                        <IconButton onClick={() => setShowVoiceMessage(!showVoiceMessage)} title="Voice Message">
                            <MicIcon />
                        </IconButton>
                        <IconButton onClick={() => setShowScheduler(!showScheduler)} title="Schedule Message">
                            <ScheduleIcon />
                        </IconButton>
                        <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Add Emoji">
                            <EmojiIcon />
                        </IconButton>
                    </Box>

                    {/* Feature Overlays */}
                    {showGifPicker && (
                        <Box sx={{ position: 'absolute', bottom: '100%', left: 0, right: 0, mb: 1 }}>
                            <Paper elevation={3} sx={{ p: 2 }}>
                                <GifPicker
                                    onSelect={handleGifSelect}
                                    onClose={() => setShowGifPicker(false)}
                                />
                            </Paper>
                        </Box>
                    )}

                    {showVoiceMessage && (
                        <Box sx={{ position: 'absolute', bottom: '100%', left: 0, right: 0, mb: 1 }}>
                            <Paper elevation={3} sx={{ p: 2 }}>
                                <VoiceMessage
                                    onSend={handleVoiceMessage}
                                    onClose={() => setShowVoiceMessage(false)}
                                />
                            </Paper>
                        </Box>
                    )}

                    {showScheduler && (
                        <Box sx={{ position: 'absolute', bottom: '100%', left: 0, right: 0, mb: 1 }}>
                            <Paper elevation={3} sx={{ p: 2 }}>
                                <MessageScheduler
                                    scheduledMessages={scheduledMessages}
                                    onSchedule={handleScheduleMessage}
                                    onClose={() => setShowScheduler(false)}
                                />
                            </Paper>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            value={messageInput}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            variant="outlined"
                            size="small"
                        />
                        <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {/* Profile Panel */}
            <Box
                sx={{
                    width: 300,
                    position: 'fixed',
                    right: showProfile ? 0 : -300,
                    top: 0,
                    height: '100vh',
                    bgcolor: 'background.paper',
                    borderLeft: 1,
                    borderColor: 'divider',
                    transition: 'right 0.3s ease-in-out',
                    overflowY: 'auto',
                    mt: 8 // Add margin top to account for AppBar
                }}
            >
                <UserProfile user={user} />
            </Box>
        </Box>
    );
} 