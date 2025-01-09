import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';

const MessageBubble = styled(Paper)(({ theme, isCurrentUser }) => ({
    padding: theme.spacing(1.5),
    maxWidth: '70%',
    borderRadius: isCurrentUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
    backgroundColor: isCurrentUser ? theme.palette.primary.main : theme.palette.background.paper,
    color: isCurrentUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
    boxShadow: theme.shadows[2],
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        [isCurrentUser ? 'right' : 'left']: -8,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: isCurrentUser ? '0 0 8px 8px' : '8px 8px 0 0',
        borderColor: isCurrentUser
            ? `transparent transparent transparent ${theme.palette.primary.main}`
            : `transparent ${theme.palette.background.paper} transparent transparent`
    }
}));

const Message = ({ message, isCurrentUser }) => {
    const renderContent = () => {
        switch (message.type) {
            case 'gif':
                return (
                    <Box
                        component="img"
                        src={message.content}
                        alt="GIF"
                        sx={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: 1,
                            mt: message.text ? 1 : 0
                        }}
                    />
                );
            default:
                return (
                    <Typography variant="body1">
                        {message.content}
                    </Typography>
                );
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                mb: 2,
                flexDirection: isCurrentUser ? 'row-reverse' : 'row'
            }}
        >
            <Avatar
                src={message.avatar}
                sx={{
                    width: 32,
                    height: 32,
                    bgcolor: isCurrentUser ? 'primary.main' : 'secondary.main'
                }}
            >
                {message.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ maxWidth: '70%' }}>
                {!isCurrentUser && (
                    <Typography
                        variant="caption"
                        sx={{
                            ml: 1.5,
                            mb: 0.5,
                            display: 'block',
                            color: 'text.secondary'
                        }}
                    >
                        {message.username}
                    </Typography>
                )}
                <MessageBubble isCurrentUser={isCurrentUser}>
                    {renderContent()}
                </MessageBubble>
            </Box>
        </Box>
    );
};

export default Message; 