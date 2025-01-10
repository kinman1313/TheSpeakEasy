import React, { useEffect } from 'react';
import { Box, Typography, Paper, Avatar, Tooltip, Badge } from '@mui/material';
import { ReactionButton } from './ReactionPicker';

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
    return (
        <Box sx={{ width: '100%', maxWidth: 300 }}>
            <audio
                controls
                src={audioUrl}
                style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: 'rgba(0,0,0,0.05)'
                }}
            />
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

    useEffect(() => {
        console.log('Rendering message:', message); // Debug log
    }, [message]);

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
                    bgcolor: isOwnMessage ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32
                }}
            >
                {(message.sender || 'U')[0].toUpperCase()}
            </Avatar>

            <Paper
                elevation={1}
                sx={{
                    p: 1.5,
                    maxWidth: '70%',
                    bgcolor: isOwnMessage ? 'primary.light' : 'background.paper',
                    borderRadius: 2,
                    position: 'relative'
                }}
            >
                <Box sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                        {message.sender}
                        {message.timestamp && (
                            <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                        )}
                    </Typography>
                </Box>

                {renderMessageContent()}

                {message.reactions && message.reactions.length > 0 && (
                    <MessageReactions
                        reactions={message.reactions}
                        onRemoveReaction={(emoji) => onRemoveReaction?.(message._id, emoji)}
                        currentUser={currentUser}
                    />
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                    <ReactionButton
                        onReactionSelect={(emoji) => onReaction?.(message._id, emoji)}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default MessageThread; 