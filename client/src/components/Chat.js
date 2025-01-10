import React, { useState, useEffect, useRef } from 'react';
import { Box, Drawer, IconButton, Divider, Typography } from '@mui/material';
import {
    Add as AddIcon,
    Send as SendIcon,
    Gif as GifIcon,
    Mic as MicIcon,
    Schedule as ScheduleIcon,
    EmojiEmotions as EmojiIcon
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

const drawerWidth = 240;

export default function Chat() {
    const { socket } = useSocket();
    const { user } = useAuth();
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

    return (
        <Box sx={{ display: 'flex' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Chats</Typography>
                    <IconButton onClick={() => setIsNewChatOpen(true)}>
                        <AddIcon />
                    </IconButton>
                </Box>
                <Divider />
                <RoomList
                    rooms={rooms}
                    activeRoom={activeRoom}
                    onRoomSelect={handleRoomSelect}
                />
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, position: 'relative' }}>
                {activeRoom ? (
                    <>
                        <Box sx={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
                            {messages.map((message, index) => (
                                <MessageThread
                                    key={message._id || index}
                                    message={message}
                                    currentUser={user.username}
                                    onReply={(content) => handleSendMessage(content)}
                                    onReaction={handleReaction}
                                    onRemoveReaction={handleRemoveReaction}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </Box>

                        <TypingIndicator users={typingUsers} />

                        <Box sx={{ mt: 2 }}>
                            <ChatInput
                                ref={messageInputRef}
                                onSend={handleSendMessage}
                                onGifClick={() => setShowGifPicker(true)}
                                onVoiceClick={() => setShowVoiceMessage(true)}
                                onScheduleClick={() => setShowScheduler(true)}
                                onEmojiClick={() => setShowEmojiPicker(true)}
                                onTyping={(isTyping) => {
                                    if (socket && activeRoom) {
                                        socket.emit('typing', {
                                            roomId: activeRoom._id,
                                            isTyping
                                        });
                                    }
                                }}
                            />
                        </Box>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="h6" color="text.secondary">
                            Select a chat to start messaging
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Feature Modals/Popovers */}
            {showGifPicker && (
                <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                />
            )}
            {showVoiceMessage && (
                <VoiceMessage
                    onSend={handleVoiceMessage}
                    onClose={() => setShowVoiceMessage(false)}
                />
            )}
            {showScheduler && (
                <MessageScheduler
                    scheduledMessages={scheduledMessages}
                    onSchedule={handleScheduleMessage}
                    onClose={() => setShowScheduler(false)}
                />
            )}
            {showEmojiPicker && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 80,
                        right: 16,
                        zIndex: 1000
                    }}
                >
                    <Picker
                        data={data}
                        onEmojiSelect={(emoji) => {
                            handleSendMessage(emoji.native);
                            setShowEmojiPicker(false);
                        }}
                        theme={theme.palette.mode}
                    />
                </Box>
            )}

            <NewChatDialog
                open={isNewChatOpen}
                onClose={() => setIsNewChatOpen(false)}
                onCreateDM={handleCreateDM}
            />
        </Box>
    );
} 