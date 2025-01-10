import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Badge } from '@mui/material';
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

const MessageThread = ({
    message,
    currentUser,
    onReply,
    onReaction,
    onRemoveReaction
}) => {
    const isOwnMessage = message.username === currentUser;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                mb: 2,
                gap: 1,
            }}
        >
            <Paper
                elevation={1}
                sx={{
                    p: 1,
                    maxWidth: '70%',
                    bgcolor: isOwnMessage ? 'primary.light' : 'background.paper',
                }}
            >
                {!isOwnMessage && (
                    <Typography variant="caption" color="text.secondary">
                        {message.username}
                    </Typography>
                )}

                {message.type === 'text' && (
                    <Typography>{message.content}</Typography>
                )}

                {message.type === 'gif' && (
                    <Box
                        component="img"
                        src={message.content}
                        alt="GIF"
                        sx={{ maxWidth: '100%', borderRadius: 1 }}
                    />
                )}

                {message.type === 'voice' && (
                    <audio controls src={message.content} style={{ width: '100%' }} />
                )}

                <MessageReactions
                    reactions={message.reactions || []}
                    onRemoveReaction={(emoji) => onRemoveReaction(message._id, emoji)}
                    currentUser={currentUser}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                    <ReactionButton
                        onReactionSelect={(emoji) => onReaction(message._id, emoji)}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default MessageThread; 