import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Tooltip,
    Paper,
    Popover,
    Typography,
    Chip,
    Avatar,
    Badge,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemIcon
} from '@mui/material';
import {
    AddReaction as AddReactionIcon,
    EmojiEmotions as EmojiIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const MessageReactions = ({
    reactions = [],
    onAddReaction,
    onRemoveReaction,
    currentUserId
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [showReactors, setShowReactors] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setShowPicker(false);
    };

    const handleEmojiSelect = (emoji) => {
        onAddReaction(emoji.native);
        handleClose();
    };

    const handleQuickReaction = (emoji) => {
        onAddReaction(emoji);
        handleClose();
    };

    const handleReactionClick = (emoji) => {
        const hasReacted = reactions
            .find(r => r.emoji === emoji)?.users
            .some(userId => userId === currentUserId);

        if (hasReacted) {
            onRemoveReaction(emoji);
        } else {
            onAddReaction(emoji);
        }
    };

    const getReactionCount = (emoji) => {
        return reactions.find(r => r.emoji === emoji)?.users.length || 0;
    };

    const hasUserReacted = (emoji) => {
        return reactions
            .find(r => r.emoji === emoji)?.users
            .some(userId => userId === currentUserId);
    };

    const getReactors = (emoji) => {
        return reactions.find(r => r.emoji === emoji)?.users || [];
    };

    const groupedReactions = reactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = reaction.users;
        return acc;
    }, {});

    return (
        <>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {Object.entries(groupedReactions).map(([emoji, users]) => (
                    <motion.div
                        key={emoji}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                    >
                        <Chip
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <span>{emoji}</span>
                                    <Typography variant="caption">{users.length}</Typography>
                                </Box>
                            }
                            onClick={() => handleReactionClick(emoji)}
                            onMouseEnter={() => {
                                setSelectedEmoji(emoji);
                                setShowReactors(true);
                            }}
                            onMouseLeave={() => {
                                setSelectedEmoji(null);
                                setShowReactors(false);
                            }}
                            color={hasUserReacted(emoji) ? 'primary' : 'default'}
                            variant={hasUserReacted(emoji) ? 'filled' : 'outlined'}
                            size="small"
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: hasUserReacted(emoji)
                                        ? 'primary.dark'
                                        : 'action.hover'
                                }
                            }}
                        />
                    </motion.div>
                ))}
                <Tooltip title="Add Reaction">
                    <IconButton
                        size="small"
                        onClick={handleClick}
                        sx={{
                            width: 24,
                            height: 24,
                            '&:hover': {
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        <AddReactionIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                PaperProps={{
                    sx: {
                        p: 1,
                        width: showPicker ? 352 : 'auto'
                    }
                }}
            >
                {showPicker ? (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                            <IconButton size="small" onClick={() => setShowPicker(false)}>
                                <EmojiIcon />
                            </IconButton>
                        </Box>
                        <Picker
                            data={data}
                            onEmojiSelect={handleEmojiSelect}
                            theme="dark"
                            set="native"
                        />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {QUICK_REACTIONS.map((emoji) => (
                            <IconButton
                                key={emoji}
                                size="small"
                                onClick={() => handleQuickReaction(emoji)}
                            >
                                {emoji}
                            </IconButton>
                        ))}
                        <Divider orientation="vertical" flexItem />
                        <IconButton
                            size="small"
                            onClick={() => setShowPicker(true)}
                        >
                            <EmojiIcon />
                        </IconButton>
                    </Box>
                )}
            </Popover>

            <Popover
                open={showReactors && selectedEmoji}
                anchorEl={anchorEl}
                onClose={() => setShowReactors(false)}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left'
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                }}
                PaperProps={{
                    sx: {
                        width: 250,
                        maxHeight: 300
                    }
                }}
            >
                <List dense>
                    <ListItem>
                        <ListItemIcon>
                            <PeopleIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={`Reacted with ${selectedEmoji}`}
                            secondary={`${getReactionCount(selectedEmoji)} ${getReactionCount(selectedEmoji) === 1 ? 'person' : 'people'
                                }`}
                        />
                    </ListItem>
                    <Divider />
                    {getReactors(selectedEmoji).map((user) => (
                        <ListItem key={user.id}>
                            <ListItemAvatar>
                                <Avatar src={user.avatar?.url}>
                                    {user.username[0].toUpperCase()}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={user.username}
                                secondary={user.id === currentUserId ? '(You)' : null}
                            />
                        </ListItem>
                    ))}
                </List>
            </Popover>
        </>
    );
};

export default MessageReactions; 