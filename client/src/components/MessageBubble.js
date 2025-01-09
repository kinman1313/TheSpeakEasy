import React, { useState, useRef } from 'react';
import { Paper, Typography, Box, IconButton, Slider } from '@mui/material';
import { PlayArrow as PlayIcon, Pause as PauseIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const bubbleVariants = {
    modern: {
        borderRadius: '18px',
        padding: '10px 16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    classic: {
        borderRadius: '4px',
        padding: '8px 12px'
    },
    minimal: {
        borderRadius: '0px',
        padding: '6px 10px',
        boxShadow: 'none'
    }
};

const MessageBubble = ({ message, isOwn }) => {
    const { user } = useAuth();
    const bubbleStyle = user.preferences?.bubbleStyle || 'modern';
    const messageColor = user.preferences?.messageColor || '#7C4DFF';
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(new Audio());

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            if (message.text.startsWith('[VOICE] ')) {
                audioRef.current.src = message.text.replace('[VOICE] ', '');
                audioRef.current.play();
            }
        }
        setIsPlaying(!isPlaying);
    };

    React.useEffect(() => {
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
                    <Box
                        component="img"
                        src={message.text.replace('[GIF] ', '')}
                        alt="GIF"
                        sx={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '200px',
                            objectFit: 'cover',
                            borderRadius: bubbleStyle === 'modern' ? '12px' : '4px'
                        }}
                    />
                ) : message.text?.startsWith('[VOICE]') ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 250 }}>
                        <IconButton
                            size="small"
                            onClick={handlePlayPause}
                            sx={{ color: isOwn ? 'white' : 'inherit' }}
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
                            />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: 45 }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </Typography>
                    </Box>
                ) : (
                    <Typography variant="body1">
                        {message.text}
                    </Typography>
                )}
            </Paper>
        </motion.div>
    );
};

export default MessageBubble; 