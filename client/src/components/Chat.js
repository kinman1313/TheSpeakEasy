import React, { useState, useEffect, useRef } from 'react';
import { Box, Drawer, IconButton, Divider, Typography, Avatar, Menu, MenuItem, Tooltip } from '@mui/material';
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
    Logout as LogoutIcon
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
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);

    // Feature states
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showVoiceMessage, setShowVoiceMessage] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleGifSelect = (gif) => {
        handleSendMessage(gif.url, 'gif', {
            preview: gif.preview?.url,
            height: gif.height,
            width: gif.width
        });
        setShowGifPicker(false);
    };

    const handleVoiceMessage = (audioBlob) => {
        const reader = new FileReader();
        reader.onload = () => {
            handleSendMessage(reader.result, 'voice', {
                duration: audioBlob.duration,
                type: audioBlob.type
            });
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
            metadata,
            sender: user.username,
            timestamp: new Date().toISOString()
        };

        console.log('Sending message:', message); // Debug log
        socket.emit('message', message);

        // Optimistically add message to UI
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

    return (
        <Box sx={{
            display: 'flex',
            height: '100vh',
            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
            color: 'white'
        }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: 'rgba(13, 71, 161, 0.25)',
                        backdropFilter: 'blur(10px)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white'
                    },
                }}
            >
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ProfilePicture size={40} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {user?.username}
                        </Typography>
                    </Box>
                    <IconButton
                        color="inherit"
                        onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Menu
                        anchorEl={userMenuAnchor}
                        open={Boolean(userMenuAnchor)}
                        onClose={() => setUserMenuAnchor(null)}
                        PaperProps={{
                            sx: {
                                background: 'rgba(13, 71, 161, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                '& .MuiMenuItem-root': {
                                    gap: 1.5
                                }
                            }
                        }}
                    >
                        <MenuItem onClick={() => setUserMenuAnchor(null)}>
                            <AccountIcon />
                            Profile Settings
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon />
                            Logout
                        </MenuItem>
                    </Menu>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
                        Online Users ({onlineUsers.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {onlineUsers.map(user => (
                            <Tooltip key={user.id} title={user.username}>
                                <Avatar
                                    src={user.avatar}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        border: '2px solid #4CAF50'
                                    }}
                                >
                                    {user.username[0]}
                                </Avatar>
                            </Tooltip>
                        ))}
                    </Box>
                </Box>
            </Drawer>

            <Box component="main" sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                background: 'rgba(25, 118, 210, 0.1)',
                backdropFilter: 'blur(10px)',
            }}>
                <Box sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {loading ? (
                        <Typography sx={{ textAlign: 'center', mt: 2 }}>
                            Connecting to chat...
                        </Typography>
                    ) : messages.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', mt: 2 }}>
                            No messages yet. Start the conversation!
                        </Typography>
                    ) : (
                        messages.map((message, index) => (
                            <MessageThread
                                key={message._id || index}
                                message={message}
                                currentUser={user?.username}
                                onReply={(content) => handleSendMessage(content)}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                <Box sx={{
                    p: 2,
                    background: 'rgba(13, 71, 161, 0.3)',
                    backdropFilter: 'blur(10px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <TypingIndicator users={Array.from(typingUsers)} />
                    <ChatInput
                        ref={messageInputRef}
                        onSendMessage={handleSendMessage}
                        onTyping={(isTyping) => socket?.emit('typing', { isTyping })}
                        onGifClick={() => setShowGifPicker(true)}
                        onVoiceClick={() => setShowVoiceMessage(true)}
                        onScheduleClick={() => setShowScheduler(true)}
                        onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    />
                </Box>

                {showGifPicker && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: 80,
                        right: 16,
                        background: 'rgba(13, 71, 161, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
                    </Box>
                )}

                {showEmojiPicker && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: 80,
                        right: 16,
                        zIndex: 1000,
                        '& em-emoji-picker': {
                            '--rgb-background': '13, 71, 161',
                            '--rgb-input': '255, 255, 255',
                            '--border-radius': '8px',
                            '--border-color': 'rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }
                    }}>
                        <Picker
                            data={data}
                            onEmojiSelect={(emoji) => {
                                handleSendMessage(emoji.native);
                                setShowEmojiPicker(false);
                            }}
                            theme="dark"
                        />
                    </Box>
                )}

                {showVoiceMessage && (
                    <VoiceMessage onSend={handleVoiceMessage} onClose={() => setShowVoiceMessage(false)} />
                )}

                {showScheduler && (
                    <MessageScheduler
                        onSchedule={handleScheduleMessage}
                        onClose={() => setShowScheduler(false)}
                        scheduledMessages={scheduledMessages}
                    />
                )}
            </Box>
        </Box>
    );
} 