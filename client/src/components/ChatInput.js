import React, { useState, useRef } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Popover
} from '@mui/material';
import {
    Send as SendIcon,
    Gif as GifIcon
} from '@mui/icons-material';
import GifPicker from './GifPicker';

const ChatInput = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');
    const [gifAnchorEl, setGifAnchorEl] = useState(null);
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage({ type: 'text', content: message });
            setMessage('');
        }
    };

    const handleGifSelect = (gif) => {
        onSendMessage({
            type: 'gif',
            content: gif.url,
            metadata: {
                width: gif.width,
                height: gif.height
            }
        });
        setGifAnchorEl(null);
    };

    return (
        <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    ref={inputRef}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                        }
                    }}
                />
                <IconButton
                    color="primary"
                    onClick={(e) => setGifAnchorEl(e.currentTarget)}
                >
                    <GifIcon />
                </IconButton>
                <IconButton type="submit" color="primary" disabled={!message.trim()}>
                    <SendIcon />
                </IconButton>
            </form>

            <Popover
                open={Boolean(gifAnchorEl)}
                anchorEl={gifAnchorEl}
                onClose={() => setGifAnchorEl(null)}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                sx={{
                    mt: -2
                }}
            >
                <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setGifAnchorEl(null)}
                />
            </Popover>
        </Box>
    );
};

export default ChatInput; 