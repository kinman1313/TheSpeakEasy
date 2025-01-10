import React, { useState, useRef, useCallback } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { Send as SendIcon, Gif as GifIcon, Mic as MicIcon, Schedule as ScheduleIcon, EmojiEmotions as EmojiIcon } from '@mui/icons-material';
import debounce from 'lodash/debounce';

const ChatInput = React.forwardRef(({ onSend, onGifClick, onVoiceClick, onScheduleClick, onEmojiClick, onTyping }, ref) => {
    const [message, setMessage] = useState('');
    const isTypingRef = useRef(false);

    // Debounce the stopTyping event
    const debouncedStopTyping = useCallback(
        debounce(() => {
            if (isTypingRef.current) {
                isTypingRef.current = false;
                onTyping?.(false);
            }
        }, 1000),
        [onTyping]
    );

    const handleTyping = () => {
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            onTyping?.(true);
        }
        debouncedStopTyping();
    };

    const handleSend = () => {
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
            isTypingRef.current = false;
            onTyping?.(false);
            debouncedStopTyping.cancel();
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton onClick={onGifClick}>
                <GifIcon />
            </IconButton>
            <IconButton onClick={onVoiceClick}>
                <MicIcon />
            </IconButton>
            <IconButton onClick={onScheduleClick}>
                <ScheduleIcon />
            </IconButton>
            <IconButton onClick={onEmojiClick}>
                <EmojiIcon />
            </IconButton>

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
            />

            <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!message.trim()}
            >
                <SendIcon />
            </IconButton>
        </Box>
    );
});

export default ChatInput; 