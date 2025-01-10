import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Avatar, Tooltip, Badge, IconButton, Slider } from '@mui/material';
import { ReactionButton } from './ReactionPicker';
import { PlayArrow as PlayArrowIcon, Stop as StopIcon, Timer as TimerIcon } from '@mui/icons-material';

const MessageReactions = ({ reactions, onRemoveReaction, currentUser }) => {
    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction.username);
        return acc;
    }, {});

    return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {Object.entries(groupedReactions).map(([emoji, users]) => (
                <Tooltip
                    key={emoji}
                    title={users.join(', ')}
                    placement="top"
                >
                    <Badge
                        badgeContent={users.length}
                        color="primary"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                            if (users.includes(currentUser)) {
                                onRemoveReaction(emoji);
                            }
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor: users.includes(currentUser) ? 'action.selected' : 'action.hover',
                                borderRadius: 1,
                                px: 0.5,
                                py: 0.25,
                            }}
                        >
                            {emoji}
                        </Box>
                    </Badge>
                </Tooltip>
            ))}
        </Box>
    );
};

const VoiceMessage = ({ audioUrl }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        const audio = audioRef.current;
        audio.src = audioUrl;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
            audio.src = '';
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 300 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={togglePlay} size="small">
                    {isPlaying ? <StopIcon /> : <PlayArrowIcon />}
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
                    />
                </Box>
                <Typography variant="caption">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
            </Box>
        </Box>
    );
};

const MessageThread = ({
    message,
    currentUser,
    onReply,
    onReaction,
    onRemoveReaction
}) => {
    const isOwnMessage = message.sender === currentUser;
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (message.metadata?.vanishTime) {
            const messageTime = new Date(message.timestamp).getTime();
            const vanishTime = messageTime + (message.metadata.vanishTime * 60 * 1000);

            const updateTimer = () => {
                const now = Date.now();
                const remaining = Math.max(0, vanishTime - now);
                if (remaining === 0) return;

                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [message.timestamp, message.metadata?.vanishTime]);

    const renderMessageContent = () => {
        console.log('Rendering message type:', message.type); // Debug log

        switch (message.type) {
            case 'text':
                return <Typography>{message.content}</Typography>;

            case 'gif':
                return (
                    <Box
                        component="img"
                        src={message.content}
                        alt="GIF"
                        sx={{
                            maxWidth: '100%',
                            borderRadius: 1,
                            maxHeight: '200px',
                            objectFit: 'contain'
                        }}
                    />
                );

            case 'voice':
                return <VoiceMessage audioUrl={message.content} />;

            default:
                console.warn('Unknown message type:', message.type);
                return <Typography color="error">Unsupported message type: {message.type}</Typography>;
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                mb: 2,
                gap: 1,
            }}
        >
            <Avatar
                sx={{
                    bgcolor: isOwnMessage ? 'rgba(243, 215, 127, 0.2)' : 'rgba(243, 215, 127, 0.15)',
                    width: 32,
                    height: 32,
                    border: '2px solid rgba(243, 215, 127, 0.3)',
                    color: '#f3d77f',
                    boxShadow: '0 0 10px rgba(243, 215, 127, 0.2)'
                }}
            >
                {(message.sender || 'U')[0].toUpperCase()}
            </Avatar>

            <Paper
                elevation={1}
                sx={{
                    p: 1.5,
                    maxWidth: '70%',
                    bgcolor: isOwnMessage ? 'rgba(243, 215, 127, 0.1)' : 'rgba(10, 25, 41, 0.6)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    position: 'relative',
                    border: '1px solid rgba(243, 215, 127, 0.1)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(243, 215, 127, 0.2), transparent)'
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: isOwnMessage ? 'auto' : 0,
                        right: isOwnMessage ? 0 : 'auto',
                        width: '1px',
                        height: '100%',
                        background: 'linear-gradient(180deg, rgba(243, 215, 127, 0.2), transparent)'
                    }
                }}
            >
                <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{
                        color: isOwnMessage ? 'rgba(243, 215, 127, 0.9)' : 'rgba(255, 255, 255, 0.7)'
                    }}>
                        {message.sender}
                        {message.timestamp && (
                            <span style={{
                                marginLeft: '8px',
                                opacity: 0.7,
                                fontSize: '0.8em',
                                color: isOwnMessage ? 'rgba(243, 215, 127, 0.7)' : 'rgba(255, 255, 255, 0.5)'
                            }}>
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                        )}
                    </Typography>
                    {timeLeft && (
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: isOwnMessage ? 'rgba(243, 215, 127, 0.7)' : 'rgba(255, 255, 255, 0.5)',
                            fontSize: '0.75rem'
                        }}>
                            <TimerIcon sx={{ fontSize: '0.875rem' }} />
                            {timeLeft}
                        </Box>
                    )}
                </Box>

                {renderMessageContent()}

                {message.reactions && message.reactions.length > 0 && (
                    <MessageReactions
                        reactions={message.reactions}
                        onRemoveReaction={(emoji) => onRemoveReaction?.(message._id, emoji)}
                        currentUser={currentUser}
                    />
                )}

                <Box sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mt: 0.5,
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                        opacity: 1
                    }
                }}>
                    <ReactionButton
                        onReactionSelect={(emoji) => onReaction?.(message._id, emoji)}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default MessageThread; 