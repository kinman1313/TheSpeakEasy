import React, { useState, useRef, forwardRef } from 'react';
import { Box, TextField, IconButton, Tooltip } from '@mui/material';
import {
    Send as SendIcon,
    Gif as GifIcon,
    Mic as MicIcon,
    Schedule as ScheduleIcon,
    EmojiEmotions as EmojiIcon
} from '@mui/icons-material';

const ChatInput = forwardRef(({ onSendMessage, onGifClick, onVoiceClick, onScheduleClick, onEmojiClick, onTyping }, ref) => {
    const [message, setMessage] = useState('');
    const isTypingRef = useRef(false);
    const typingTimeoutRef = useRef(null);

    const handleTyping = () => {
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            onTyping?.(true);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            onTyping?.(false);
        }, 2000);
    };

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
            isTypingRef.current = false;
            onTyping?.(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Send GIF">
                <IconButton onClick={onGifClick}>
                    <GifIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Voice Message">
                <IconButton onClick={onVoiceClick}>
                    <MicIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Schedule Message">
                <IconButton onClick={onScheduleClick}>
                    <ScheduleIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Emoji">
                <IconButton onClick={onEmojiClick}>
                    <EmojiIcon />
                </IconButton>
            </Tooltip>

            <TextField
                fullWidth
                value={message}
                onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                }}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Type a message..."
                multiline
                maxRows={4}
                ref={ref}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                    }
                }}
            />

            <Tooltip title="Send">
                <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={!message.trim()}
                >
                    <SendIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
});

export default ChatInput; 