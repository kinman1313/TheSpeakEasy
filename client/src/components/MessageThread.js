import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const MessageThread = ({ messages, typingUsers, onMessageDelete, endRef }) => {
    const { user } = useAuth();
    const { theme } = useTheme();

    const messageGroups = messages.reduce((groups, message) => {
        const lastGroup = groups[groups.length - 1];
        const isSameUser = lastGroup && lastGroup[0].sender === message.sender;
        const isWithinTimeframe = lastGroup &&
            (new Date(message.timestamp) - new Date(lastGroup[lastGroup.length - 1].timestamp)) < 300000; // 5 minutes

        if (isSameUser && isWithinTimeframe) {
            lastGroup.push(message);
        } else {
            groups.push([message]);
        }
        return groups;
    }, []);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'relative'
            }}
        >
            {messageGroups.map((group, groupIndex) => {
                const isOwn = group[0].sender === user.username;
                const showTimestamp = groupIndex === 0 ||
                    (new Date(group[0].timestamp) - new Date(messageGroups[groupIndex - 1][messageGroups[groupIndex - 1].length - 1].timestamp)) > 900000; // 15 minutes

                return (
                    <Box
                        key={group[0]._id}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isOwn ? 'flex-end' : 'flex-start',
                            gap: 1
                        }}
                    >
                        {showTimestamp && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.secondary',
                                    alignSelf: 'center',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: '12px',
                                    background: 'rgba(15, 23, 42, 0.45)',
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    mb: 1
                                }}
                            >
                                {new Date(group[0].timestamp).toLocaleString()}
                            </Typography>
                        )}
                        {!isOwn && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'text.secondary',
                                    ml: 2,
                                    mb: 0.5
                                }}
                            >
                                {group[0].sender}
                            </Typography>
                        )}
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5,
                                maxWidth: '70%'
                            }}
                        >
                            {group.map((message, index) => (
                                <MessageBubble
                                    key={message._id}
                                    message={message}
                                    isOwn={isOwn}
                                    isFirst={index === 0}
                                    isLast={index === group.length - 1}
                                    onDelete={() => onMessageDelete(message._id)}
                                />
                            ))}
                        </Box>
                    </Box>
                );
            })}
            {typingUsers.size > 0 && (
                <Box
                    sx={{
                        position: 'sticky',
                        bottom: 0,
                        alignSelf: 'flex-start',
                        px: 2,
                        py: 1,
                        borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        mt: 1
                    }}
                >
                    <TypingIndicator users={Array.from(typingUsers)} />
                </Box>
            )}
            <div ref={endRef} />
        </Box>
    );
};

export default MessageThread; 