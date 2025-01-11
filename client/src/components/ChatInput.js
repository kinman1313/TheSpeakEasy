import React, { forwardRef, useState } from 'react';
import {
    Box,
    IconButton,
    InputBase,
    Tooltip,
    Zoom
} from '@mui/material';
import {
    Send as SendIcon,
    Mic as MicIcon,
    Gif as GifIcon,
    EmojiEmotions as EmojiIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';

const ChatInput = forwardRef(({ onSendMessage, onVoiceMessage, onGifClick, onEmojiClick, onScheduleMessage }, ref) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleChange = (e) => {
        setMessage(e.target.value);
        if (!isTyping && e.target.value.trim()) {
            setIsTyping(true);
        } else if (isTyping && !e.target.value.trim()) {
            setIsTyping(false);
        }
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flexWrap: 'wrap'
                }}
            >
                <Tooltip title="Add emoji" TransitionComponent={Zoom}>
                    <IconButton
                        onClick={onEmojiClick}
                        sx={{
                            color: 'text.secondary',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                color: 'primary.main',
                                background: 'rgba(59, 130, 246, 0.12)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)'
                            }
                        }}
                    >
                        <EmojiIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Send GIF" TransitionComponent={Zoom}>
                    <IconButton
                        onClick={onGifClick}
                        sx={{
                            color: 'text.secondary',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                color: 'primary.main',
                                background: 'rgba(59, 130, 246, 0.12)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)'
                            }
                        }}
                    >
                        <GifIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Record voice message" TransitionComponent={Zoom}>
                    <IconButton
                        onClick={onVoiceMessage}
                        sx={{
                            color: 'text.secondary',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                color: 'primary.main',
                                background: 'rgba(59, 130, 246, 0.12)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)'
                            }
                        }}
                    >
                        <MicIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Schedule message" TransitionComponent={Zoom}>
                    <IconButton
                        onClick={onScheduleMessage}
                        sx={{
                            color: 'text.secondary',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                color: 'primary.main',
                                background: 'rgba(59, 130, 246, 0.12)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)'
                            }
                        }}
                    >
                        <ScheduleIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            <InputBase
                inputRef={ref}
                multiline
                maxRows={4}
                value={message}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                sx={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.45)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    px: 2,
                    py: 1,
                    color: 'text.primary',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        background: 'rgba(15, 23, 42, 0.55)',
                        borderColor: 'rgba(59, 130, 246, 0.3)',
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)'
                    },
                    '&.Mui-focused': {
                        background: 'rgba(15, 23, 42, 0.65)',
                        borderColor: 'primary.main',
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.2)'
                    }
                }}
            />

            <Tooltip title="Send message" TransitionComponent={Zoom}>
                <IconButton
                    type="submit"
                    disabled={!message.trim()}
                    sx={{
                        color: message.trim() ? 'primary.main' : 'text.disabled',
                        background: message.trim() ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                            background: message.trim() ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                            transform: message.trim() ? 'translateY(-2px) scale(1.05)' : 'none',
                            boxShadow: message.trim() ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none'
                        }
                    }}
                >
                    <SendIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
});

export default ChatInput; 