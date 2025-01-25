import React, { useState, useEffect, useRef } from 'react';
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
    Typography,
    Snackbar,
    Alert
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
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [drawerOpen, setDrawerOpen] = useState(window.innerWidth >= 600);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
    const [connectionError, setConnectionError] = useState(false);
    const messagesEndRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Handle window resize
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

    // Socket connection and event handling
    useEffect(() => {
        const newSocket = io(config.SOCKET_URL, {
            withCredentials: true
        });
        setSocket(newSocket);

        // Join chat with authenticated username
        newSocket.emit('join', user.username);

        newSocket.on('message', (message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        newSocket.on('userJoined', (userData) => {
            const username = typeof userData === 'string' ? userData : userData.username;
            setUsers((prev) => {
                if (!prev.includes(username)) {
                    return [...prev, username];
                }
                return prev;
            });
        });

        newSocket.on('userLeft', (userData) => {
            const username = typeof userData === 'string' ? userData : userData.username;
            setUsers((prev) => prev.filter((u) => u !== username));
        });

        newSocket.on('typing', (username) => {
            setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.add(username);
                return newSet;
            });
        });

        newSocket.on('stopTyping', (username) => {
            setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(username);
                return newSet;
            });
        });

        newSocket.on('connect_error', (err) => {
            console.error('Connection error:', err);
            setConnectionError(true);
        });

        return () => newSocket.close();
    }, [user.username]);

    // Scroll to bottom when messages update
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle message input change
    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        if (socket) {
            socket.emit('typing', { username: user.username });
        }
    };

    // Handle sending a message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageInput.trim() && socket) {
            socket.emit('message', messageInput);
            setMessageInput('');
            socket.emit('stopTyping', { username: user.username });
        }
    };

    // Handle logout
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
                    <MessageThread
                        messages={messages}
                        typingUsers={Array.from(typingUsers)}
                        onMessageDelete={(messageId) => {
                            setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
                        }}
                        endRef={messagesEndRef}
                    />
                </Box>

                {/* Message Input Area */}
                <MessageInput
                    messageInput={messageInput}
                    handleInputChange={handleInputChange}
                    handleSendMessage={handleSendMessage}
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

            {/* Connection Error Snackbar */}
            <Snackbar
                open={connectionError}
                autoHideDuration={6000}
                onClose={() => setConnectionError(false)}
            >
                <Alert severity="error" onClose={() => setConnectionError(false)}>
                    Connection lost. Please check your internet connection.
                </Alert>
            </Snackbar>
        </Box>
    );
}