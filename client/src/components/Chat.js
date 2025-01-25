    import React, { useState, useEffect, useRef, useCallback } from 'react';
    import { useAuth } from '../contexts/AuthContext';
    import { useNavigate } from 'react-router-dom';
    import { config } from '../config';
    import {
        Box,
        AppBar,
        Toolbar,
        IconButton,
        Drawer,
        List,
        ListItem,
        ListItemIcon,
        ListItemText,
        Divider,
        Typography
    } from '@mui/material';
    import {
        Menu as MenuIcon,
        ExitToApp as LogoutIcon,
        Person as PersonIcon
    } from '@mui/icons-material';
    import { io } from 'socket.io-client';
    import TypingIndicator from './TypingIndicator';
    import MessageThread from './MessageThread';
    import UserProfile from './UserProfile';
    import MessageInput from './MessageInput';

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

        const scrollToBottom = useCallback(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, []);

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

            newSocket.on('connect_error', (err) => {
                console.error('Connection error:', err);
            });

            return () => newSocket.close();
        }, [user.username, scrollToBottom]);

        useEffect(() => {
            scrollToBottom();
        }, [messages, scrollToBottom]);

        const emitTyping = useCallback(() => {
            if (socket) {
                socket.emit('typing', { username: user.username });

                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                typingTimeoutRef.current = setTimeout(() => {
                    socket.emit('stopTyping', { username: user.username });
                }, 1000);
            }
        }, [socket, user.username]);

        const handleInputChange = useCallback((e) => {
            setMessageInput(e.target.value);
            emitTyping();
        }, [emitTyping]);

        const handleSendMessage = useCallback((e) => {
            e.preventDefault();
            if (messageInput.trim() && socket) {
                socket.emit('message', messageInput);
                setMessageInput('');
                socket.emit('stopTyping', { username: user.username });
            }
        }, [messageInput, socket, user.username]);

        const handleGifSelect = useCallback((gif) => {
            if (socket) {
                socket.emit('message', `[GIF] ${gif.url}`);
                setShowGifPicker(false);
            }
        }, [socket]);

        const handleVoiceMessage = useCallback((audioUrl) => {
            if (socket) {
                socket.emit('message', `[VOICE] ${audioUrl}`);
            }
        }, [socket]);

        const handleScheduleMessage = useCallback((scheduleData) => {
            setScheduledMessages(prev => [...prev, scheduleData]);
            // Here you would typically also send this to the server
        }, []);

        const handleAddReaction = useCallback((messageId, emoji) => {
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
        }, [socket, user.id]);

        const handleRemoveReaction = useCallback((messageId, emoji) => {
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
        }, [socket, user.id]);

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
                            aria-label="menu"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                            Chat Room
                        </Typography>
                        <IconButton color="inherit" onClick={() => setShowProfile(!showProfile)} aria-label="profile">
                            <PersonIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>

                {/* Side Drawer for Online Users */}
                <Drawer
                    variant={isMobile ? 'temporary' : 'permanent'}
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
                    <MessageInput
                        messageInput={messageInput}
                        handleInputChange={handleInputChange}
                        handleSendMessage={handleSendMessage}
                        showGifPicker={showGifPicker}
                        setShowGifPicker={setShowGifPicker}
                        showVoiceMessage={showVoiceMessage}
                        setShowVoiceMessage={setShowVoiceMessage}
                        showScheduler={showScheduler}
                        setShowScheduler={setShowScheduler}
                        showEmojiPicker={showEmojiPicker}
                        setShowEmojiPicker={setShowEmojiPicker}
                        handleGifSelect={handleGifSelect}
                        handleVoiceMessage={handleVoiceMessage}
                        handleScheduleMessage={handleScheduleMessage}
                        scheduledMessages={scheduledMessages}
                        typingUsers={typingUsers}
                    />
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