import React, { useState, useEffect, useRef } from 'react';
import { Box, Drawer, IconButton, Divider, Typography, Avatar, Menu, MenuItem, Tooltip } from '@mui/material';
import {
    Add as AddIcon,
    Send as SendIcon,
    Gif as GifIcon,
    Mic as MicIcon,
    Schedule as ScheduleIcon,
    EmojiEmotions as EmojiIcon,
    AccessTime as AccessTimeIcon,
    Favorite as FavoriteIcon,
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Settings as SettingsIcon
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

const drawerWidth = 240;

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

    // Feature states
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showVoiceMessage, setShowVoiceMessage] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [frequentEmojis, setFrequentEmojis] = useState(() => {
        const saved = localStorage.getItem('frequentEmojis');
        return saved ? JSON.parse(saved) : [];
    });

    // Menu handlers
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        if (socket) {
            // Join default room
            socket.emit('join', user.username);

            // Message listeners
            socket.on('message', (message) => {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            });

            // Room listeners
            socket.on('dmCreated', (room) => {
                setRooms((prev) => [...prev, room]);
                setActiveRoom(room);
                socket.emit('getHistory', { roomId: room._id });
            });

            socket.on('messageHistory', ({ messages: history, roomId }) => {
                if (activeRoom?._id === roomId) {
                    setMessages(history);
                    scrollToBottom();
                }
            });

            socket.on('rooms', (roomsList) => {
                setRooms(roomsList);
                setLoading(false);
            });

            // Typing indicators
            socket.on('typing', ({ username, isTyping, roomId }) => {
                if (activeRoom?._id === roomId) {
                    setTypingUsers(prev => {
                        const newSet = new Set(prev);
                        if (isTyping) {
                            newSet.add(username);
                        } else {
                            newSet.delete(username);
                        }
                        return newSet;
                    });
                }
            });

            // Reaction handlers
            socket.on('reaction', ({ messageId, emoji, username }) => {
                setMessages(prev => prev.map(msg => {
                    if (msg._id === messageId) {
                        return {
                            ...msg,
                            reactions: [...(msg.reactions || []), { emoji, username }]
                        };
                    }
                    return msg;
                }));
            });

            socket.on('removeReaction', ({ messageId, emoji, username }) => {
                setMessages(prev => prev.map(msg => {
                    if (msg._id === messageId) {
                        return {
                            ...msg,
                            reactions: (msg.reactions || []).filter(
                                r => !(r.emoji === emoji && r.username === username)
                            )
                        };
                    }
                    return msg;
                }));
            });

            // Get initial rooms
            socket.emit('getRooms');

            return () => {
                socket.off('message');
                socket.off('dmCreated');
                socket.off('messageHistory');
                socket.off('rooms');
                socket.off('typing');
                socket.off('reaction');
                socket.off('removeReaction');
            };
        }
    }, [socket, user.username, activeRoom]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Message sending handlers
    const handleSendMessage = (content, type = 'text', metadata = {}) => {
        if (socket && activeRoom) {
            socket.emit('message', {
                type,
                content,
                metadata,
                roomId: activeRoom._id
            });
        }
    };

    const handleGifSelect = (gif) => {
        if (socket && activeRoom) {
            handleSendMessage(gif.url, 'gif', {
                width: gif.width,
                height: gif.height
            });
            setShowGifPicker(false);
        }
    };

    const handleVoiceMessage = (audioUrl) => {
        if (socket && activeRoom) {
            handleSendMessage(audioUrl, 'voice');
            setShowVoiceMessage(false);
        }
    };

    const handleScheduleMessage = (scheduleData) => {
        setScheduledMessages(prev => [...prev, scheduleData]);
        setShowScheduler(false);
    };

    // Room handlers
    const handleRoomSelect = (room) => {
        setActiveRoom(room);
        socket.emit('getHistory', { roomId: room._id });
    };

    const handleCreateDM = (username) => {
        if (socket) {
            socket.emit('createDM', { targetUsername: username });
        }
    };

    // Reaction handlers
    const handleReaction = (messageId, emoji) => {
        if (socket && activeRoom) {
            socket.emit('reaction', { messageId, emoji });
        }
    };

    const handleRemoveReaction = (messageId, emoji) => {
        if (socket && activeRoom) {
            socket.emit('removeReaction', { messageId, emoji });
        }
    };

    const updateFrequentEmojis = (emoji) => {
        setFrequentEmojis(prev => {
            const newFrequent = [
                emoji,
                ...prev.filter(e => e !== emoji)
            ].slice(0, 16); // Keep top 16 most recent
            localStorage.setItem('frequentEmojis', JSON.stringify(newFrequent));
            return newFrequent;
        });
    };

    return (
        <Box sx={{
            display: 'flex',
            height: '100vh',
            bgcolor: theme.palette.background.default,
            color: theme.palette.text.primary
        }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerOpen ? drawerWidth : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                        borderRight: `1px solid ${theme.palette.divider}`,
                        transition: theme.transitions.create('transform', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                        transform: drawerOpen ? 'none' : `translateX(-${drawerWidth}px)`,
                    },
                }}
            >
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Chats</Typography>
                    <Box>
                        <IconButton onClick={() => setIsNewChatOpen(true)}>
                            <AddIcon />
                        </IconButton>
                        <IconButton onClick={() => setDrawerOpen(false)}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </Box>
                </Box>
                <Divider />
                <RoomList
                    rooms={rooms}
                    activeRoom={activeRoom}
                    onRoomSelect={handleRoomSelect}
                />
            </Drawer>

            <Box component="main" sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                position: 'relative',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.9)',
            }}>
                {/* Header */}
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!drawerOpen && (
                            <IconButton onClick={() => setDrawerOpen(true)}>
                                <MenuIcon />
                            </IconButton>
                        )}
                        <Typography variant="h6">
                            {activeRoom?.name || 'Select a chat'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Settings">
                            <IconButton onClick={handleMenuOpen}>
                                <SettingsIcon />
                            </IconButton>
                        </Tooltip>
                        <Avatar
                            src={user.profile?.avatar?.url}
                            sx={{ width: 40, height: 40, cursor: 'pointer' }}
                            onClick={handleMenuOpen}
                        >
                            {user.username?.[0]?.toUpperCase()}
                        </Avatar>
                    </Box>
                </Box>

                {/* Messages Area */}
                <Box sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {activeRoom ? (
                        messages.map((message, index) => (
                            <MessageThread
                                key={message._id || index}
                                message={message}
                                currentUser={user.username}
                                onReply={(content) => handleSendMessage(content)}
                                onReaction={handleReaction}
                                onRemoveReaction={handleRemoveReaction}
                            />
                        ))
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: theme.palette.text.secondary
                        }}>
                            <Typography variant="h6">Select a chat to start messaging</Typography>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                {activeRoom && (
                    <Box sx={{
                        p: 2,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                    }}>
                        <TypingIndicator users={Array.from(typingUsers)} />
                        <ChatInput
                            ref={messageInputRef}
                            onSendMessage={handleSendMessage}
                            onTyping={(isTyping) => socket?.emit('typing', { isTyping, roomId: activeRoom._id })}
                            onGifClick={() => setShowGifPicker(true)}
                            onVoiceClick={() => setShowVoiceMessage(true)}
                            onScheduleClick={() => setShowScheduler(true)}
                            onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            frequentEmojis={frequentEmojis}
                        />
                    </Box>
                )}

                {/* Feature Components */}
                {showGifPicker && (
                    <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
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
                {showEmojiPicker && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: 80,
                        right: 16,
                        zIndex: 1000,
                        '& em-emoji-picker': {
                            '--border-radius': '12px',
                            '--category-icon-size': '20px',
                            '--font-family': theme.typography.fontFamily,
                            '--rgb-accent': theme.palette.primary.main.replace(
                                /^#([A-Fa-f0-9]{6})/,
                                (_, hex) => {
                                    const r = parseInt(hex.slice(0, 2), 16);
                                    const g = parseInt(hex.slice(2, 4), 16);
                                    const b = parseInt(hex.slice(4, 6), 16);
                                    return `${r}, ${g}, ${b}`;
                                }
                            ),
                            '--rgb-background': theme.palette.mode === 'dark' ? '32, 33, 36' : '255, 255, 255',
                            '--rgb-input': theme.palette.mode === 'dark' ? '255, 255, 255' : '0, 0, 0',
                            boxShadow: theme.shadows[8],
                            maxHeight: '350px'
                        }
                    }}>
                        <Picker
                            data={data}
                            onEmojiSelect={(emoji) => {
                                handleSendMessage(emoji.native);
                                updateFrequentEmojis(emoji.native);
                                setShowEmojiPicker(false);
                            }}
                        />
                    </Box>
                )}

                {/* Dialogs */}
                <NewChatDialog
                    open={isNewChatOpen}
                    onClose={() => setIsNewChatOpen(false)}
                    onCreateDM={handleCreateDM}
                />

                {/* User Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
                    <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
                    <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
                </Menu>
            </Box>
        </Box>
    );
} 