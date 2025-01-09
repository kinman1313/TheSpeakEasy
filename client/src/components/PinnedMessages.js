import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Collapse,
    Tooltip,
    Badge,
    Divider
} from '@mui/material';
import {
    PushPin as PinIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    UnfoldMore as UnfoldMoreIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const PinnedMessages = ({
    messages = [],
    onUnpin,
    onMessageClick,
    expanded = false,
    onToggle
}) => {
    const { user: currentUser } = useAuth();
    const [hoveredMessage, setHoveredMessage] = useState(null);

    const handleUnpin = (messageId, event) => {
        event.stopPropagation();
        onUnpin(messageId);
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const truncateText = (text, maxLength = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': {
                        bgcolor: 'action.hover'
                    }
                }}
                onClick={onToggle}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Badge
                        badgeContent={messages.length}
                        color="primary"
                        sx={{ mr: 2 }}
                    >
                        <PinIcon color="action" />
                    </Badge>
                    <Typography variant="subtitle1">
                        Pinned Messages
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>

            <Collapse in={expanded}>
                <Divider />
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 500,
                                    damping: 30,
                                    delay: index * 0.1
                                }}
                            >
                                <ListItem
                                    button
                                    onClick={() => onMessageClick(message)}
                                    onMouseEnter={() => setHoveredMessage(message.id)}
                                    onMouseLeave={() => setHoveredMessage(null)}
                                    sx={{
                                        transition: 'background-color 0.2s',
                                        '&:hover': {
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body1" component="span">
                                                    {message.username}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    component="span"
                                                >
                                                    {formatTimestamp(message.pinnedAt)}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {message.type === 'text'
                                                    ? truncateText(message.text)
                                                    : '[GIF]'}
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Go to message">
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMessageClick(message);
                                                }}
                                                sx={{ mr: 1 }}
                                            >
                                                <UnfoldMoreIcon />
                                            </IconButton>
                                        </Tooltip>
                                        {(currentUser?.id === message.pinnedBy ||
                                            currentUser?.isAdmin) && (
                                                <Tooltip title="Unpin message">
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        onClick={(e) => handleUnpin(message.id, e)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < messages.length - 1 && (
                                    <Divider component="li" />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </List>
            </Collapse>
        </Paper>
    );
};

export default PinnedMessages; 