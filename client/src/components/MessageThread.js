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
<<<<<<< HEAD
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
                    <Avatar src={message?.user?.avatar?.url} aria-label="user avatar">
                        {message?.user?.username ? message.user.username[0].toUpperCase() : '?'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" aria-label="username">
                                {message?.user?.username || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" aria-label="timestamp">
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
                                aria-label="reply"
                            >
                                Reply
                            </Button>
                            {replies.length > 0 && (
                                <Button
                                    size="small"
                                    startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    onClick={() => setExpanded(!expanded)}
                                    aria-label="toggle replies"
                                >
                                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                                </Button>
                            )}
=======
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
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
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
<<<<<<< HEAD

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
                                    aria-label="current user avatar"
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
                                                    aria-label="send reply"
                                                >
                                                    <SendIcon />
                                                </IconButton>
                                            )
                                        }}
                                        aria-label="reply input"
                                    />
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowReplyInput(false)}
                                    aria-label="close reply input"
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
                                            aria-label="reply item"
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={reply?.user?.avatar?.url}
                                                    sx={{ width: 32, height: 32 }}
                                                    aria-label="reply user avatar"
                                                >
                                                    {reply?.user?.username ? reply.user.username[0].toUpperCase() : '?'}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="subtitle2" aria-label="reply username">
                                                            {reply?.user?.username || 'Unknown User'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" aria-label="reply timestamp">
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
                                    aria-label="load more replies"
                                >
                                    {isLoadingReplies ? 'Loading...' : 'Load more replies'}
                                </Button>
                            )}
                        </Box>
                    )}
                </Collapse>
            </Paper>
=======
            )}
            <div ref={endRef} />
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
        </Box>
    );
};

export default MessageThread;





