<<<<<<< HEAD
import React, { useState, useRef, useEffect } from 'react';
import { Paper, Typography, Box, IconButton, Slider } from '@mui/material';
import { PlayArrow as PlayIcon, Pause as PauseIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
=======
import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Delete as DeleteIcon,
    ContentCopy as ContentCopyIcon,
    Reply as ReplyIcon,
    EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54

const MessageBubble = ({ message, isOwn, isFirst, isLast, onDelete }) => {
    const { theme } = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

<<<<<<< HEAD
    const handlePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            if (message.text.startsWith('[VOICE] ')) {
                audioRef.current.src = message.text.replace('[VOICE] ', '');
                audioRef.current.play().catch((error) => {
                    console.error('Audio playback error:', error);
                });
=======
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        handleMenuClose();
    };

    const handleDelete = () => {
        onDelete();
        handleMenuClose();
    };

    const getBubbleStyle = () => {
        const baseStyle = {
            background: isOwn
                ? 'rgba(59, 130, 246, 0.15)'
                : 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid',
            borderColor: isOwn
                ? 'rgba(59, 130, 246, 0.2)'
                : 'rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '8px 16px',
            maxWidth: '100%',
            position: 'relative',
            transition: 'all 0.3s ease-in-out',
            transform: 'translateZ(0)',
            '&:hover': {
                background: isOwn
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.08)',
                transform: 'translateY(-1px) translateZ(0)',
                boxShadow: isOwn
                    ? '0 4px 15px rgba(59, 130, 246, 0.2)'
                    : '0 4px 15px rgba(255, 255, 255, 0.1)',
                borderColor: isOwn
                    ? 'rgba(59, 130, 246, 0.3)'
                    : 'rgba(255, 255, 255, 0.12)',
                '& .message-actions': {
                    opacity: 1,
                    transform: `translate(${isOwn ? '-100%' : '100%'}, -50%) translateY(-2px)`
                }
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
            }
        };

        return baseStyle;
    };

<<<<<<< HEAD
    useEffect(() => {
        if (message.text.startsWith('[VOICE] ')) {
            audioRef.current.src = message.text.replace('[VOICE] ', '');
            audioRef.current.addEventListener('loadedmetadata', () => {
                setDuration(audioRef.current.duration);
            });
            audioRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(audioRef.current.currentTime);
            });
            audioRef.current.addEventListener('ended', () => {
                setIsPlaying(false);
                setCurrentTime(0);
            });
        }

        return () => {
            audioRef.current.pause();
            audioRef.current.src = '';
        };
    }, [message.text]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
            }}
            style={{
                alignSelf: isOwn ? 'flex-end' : 'flex-start',
                maxWidth: message.type === 'gif' ? '300px' : '70%',
                marginBottom: '8px'
            }}
        >
            <Paper
                elevation={bubbleStyle === 'minimal' ? 0 : 2}
                sx={{
                    ...bubbleVariants[bubbleStyle],
                    background: isOwn
                        ? `linear-gradient(145deg, ${messageColor}CC, ${messageColor}99)`
                        : 'rgba(19, 47, 76, 0.4)',
                    color: isOwn ? '#fff' : 'inherit',
                    overflow: 'hidden'
                }}
            >
                {message.text?.startsWith('[GIF]') ? (
=======
    const renderContent = () => {
        switch (message.type) {
            case 'text':
                return (
                    <Typography
                        variant="body1"
                        sx={{
                            color: theme.palette.text.primary,
                            wordBreak: 'break-word'
                        }}
                    >
                        {message.content}
                    </Typography>
                );
            case 'gif':
                return (
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
                    <Box
                        component="img"
                        src={message.content}
                        alt="GIF"
                        sx={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            objectFit: 'contain'
                        }}
                    />
<<<<<<< HEAD
                ) : message.text?.startsWith('[VOICE]') ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 250 }}>
                        <IconButton
                            size="small"
                            onClick={handlePlayPause}
                            sx={{ color: isOwn ? 'white' : 'inherit' }}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </IconButton>
                        <Box sx={{ flexGrow: 1, mx: 1 }}>
                            <Slider
                                size="small"
                                value={currentTime}
                                max={duration}
                                onChange={(_, value) => {
                                    audioRef.current.currentTime = value;
                                    setCurrentTime(value);
                                }}
                                sx={{
                                    color: isOwn ? 'white' : 'primary.main',
                                    '& .MuiSlider-thumb': {
                                        width: 12,
                                        height: 12,
                                    },
                                    '& .MuiSlider-rail': {
                                        opacity: 0.3,
                                    }
                                }}
                                aria-label="Audio progress"
                            />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: 45 }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="body1">
                        {message.text}
=======
                );
            case 'voice':
                return (
                    <Box
                        component="audio"
                        controls
                        src={message.content}
                        sx={{
                            width: '100%',
                            height: '40px',
                            borderRadius: '8px',
                            '&::-webkit-media-controls-panel': {
                                background: 'rgba(15, 23, 42, 0.45)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }
                        }}
                    />
                );
            default:
                return (
                    <Typography color="error">
                        Unsupported message type: {message.type}
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
                    </Typography>
                );
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
                position: 'relative'
            }}
        >
            <Box sx={getBubbleStyle()}>
                {renderContent()}
                <Box
                    className="message-actions"
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        [isOwn ? 'left' : 'right']: 0,
                        transform: `translate(${isOwn ? '-100%' : '100%'}, -50%)`,
                        opacity: 0,
                        transition: 'opacity 0.2s ease-in-out',
                        display: 'flex',
                        gap: 0.5,
                        px: 1
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={handleMenuOpen}
                        sx={{
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.3s ease-in-out',
                            '&:hover': {
                                background: 'rgba(15, 23, 42, 0.95)',
                                transform: 'scale(1.1)',
                                boxShadow: '0 0 12px rgba(59, 130, 246, 0.2)'
                            }
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: isOwn ? 'right' : 'left'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: isOwn ? 'left' : 'right'
                }}
            >
                <MenuItem onClick={handleCopy}>
                    <ListItemIcon>
                        <ContentCopyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <ReplyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Reply</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <EmojiIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>React</ListItemText>
                </MenuItem>
                {isOwn && (
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                        <ListItemIcon>
                            <DeleteIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText>Delete</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </Box>
    );
};

export default MessageBubble;
