import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Collapse,
    Divider,
    Avatar,
    Badge,
    Tooltip,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar
} from '@mui/material';
import {
    Reply as ReplyIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Send as SendIcon,
    Thread as ThreadIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import MessageReactions from './MessageReactions';

const MessageThread = ({
    message,
    replies = [],
    onReply,
    onLoadMore,
    hasMoreReplies = false,
    isLoadingReplies = false,
    onAddReaction,
    onRemoveReaction
}) => {
    const { user: currentUser } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [showReplyInput, setShowReplyInput] = useState(false);

    const handleReply = () => {
        if (replyText.trim()) {
            onReply({
                text: replyText,
                replyTo: message.id,
                timestamp: new Date(),
                user: {
                    id: currentUser.id,
                    username: currentUser.username,
                    avatar: currentUser.profile?.avatar
                }
            });
            setReplyText('');
            setShowReplyInput(false);
            setExpanded(true);
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleReply();
        }
    };

    return (
        <Box sx={{ mb: 2 }}>
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    position: 'relative'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar src={message?.user?.avatar?.url}>
                        {message?.user?.username ? message.user.username[0].toUpperCase() : '?'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2">
                                {message?.user?.username || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {message?.timestamp ? formatTimestamp(message.timestamp) : 'Unknown time'}
                            </Typography>
                        </Box>
                        <MessageBubble
                            message={message}
                            isOwn={message?.user?.id === currentUser?.id}
                        />
                        <Box sx={{ mt: 1, mb: 1 }}>
                            <MessageReactions
                                reactions={message.reactions || []}
                                onAddReaction={(emoji) => onAddReaction(message.id, emoji)}
                                onRemoveReaction={(emoji) => onRemoveReaction(message.id, emoji)}
                                currentUserId={currentUser?.id}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Button
                                size="small"
                                startIcon={<ReplyIcon />}
                                onClick={() => setShowReplyInput(!showReplyInput)}
                                sx={{ mr: 2 }}
                            >
                                Reply
                            </Button>
                            {replies.length > 0 && (
                                <Button
                                    size="small"
                                    startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>

                <AnimatePresence>
                    {showReplyInput && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Avatar
                                    src={currentUser?.profile?.avatar?.url}
                                    sx={{ width: 32, height: 32 }}
                                >
                                    {currentUser?.username ? currentUser.username[0].toUpperCase() : '?'}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        maxRows={4}
                                        placeholder="Write a reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        size="small"
                                        InputProps={{
                                            endAdornment: (
                                                <IconButton
                                                    onClick={handleReply}
                                                    disabled={!replyText.trim()}
                                                    color="primary"
                                                >
                                                    <SendIcon />
                                                </IconButton>
                                            )
                                        }}
                                    />
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowReplyInput(false)}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>

                <Collapse in={expanded}>
                    {replies.length > 0 && (
                        <Box sx={{ mt: 2, ml: 6 }}>
                            <List disablePadding>
                                {replies.map((reply, index) => (
                                    <React.Fragment key={reply.id}>
                                        <ListItem
                                            alignItems="flex-start"
                                            sx={{ px: 0 }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={reply?.user?.avatar?.url}
                                                    sx={{ width: 32, height: 32 }}
                                                >
                                                    {reply?.user?.username ? reply.user.username[0].toUpperCase() : '?'}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle2">
                                                            {reply?.user?.username || 'Unknown User'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {reply?.timestamp ? formatTimestamp(reply.timestamp) : 'Unknown time'}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondary={reply?.text || ''}
                                            />
                                        </ListItem>
                                        {index < replies.length - 1 && (
                                            <Divider variant="inset" component="li" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </List>
                            {hasMoreReplies && (
                                <Button
                                    fullWidth
                                    onClick={onLoadMore}
                                    disabled={isLoadingReplies}
                                    sx={{ mt: 1 }}
                                >
                                    {isLoadingReplies ? 'Loading...' : 'Load more replies'}
                                </Button>
                            )}
                        </Box>
                    )}
                </Collapse>
            </Paper>
        </Box>
    );
};

export default MessageThread; 