import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Popper
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const MentionInput = ({
    value,
    onChange,
    onMention,
    users = [],
    inputRef,
    placeholder = 'Type a message...'
}) => {
    const [mentionSearch, setMentionSearch] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [filteredUsers, setFilteredUsers] = useState([]);

    useEffect(() => {
        if (mentionSearch) {
            const filtered = users.filter(user =>
                user.username.toLowerCase().includes(mentionSearch.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [mentionSearch, users]);

    const handleInput = (e) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart;
        setCursorPosition(cursorPos);

        // Check for @ symbol
        const lastAtSymbol = newValue.lastIndexOf('@', cursorPos);
        if (lastAtSymbol !== -1) {
            const textAfterAt = newValue.slice(lastAtSymbol + 1, cursorPos);
            const spaceAfterAt = textAfterAt.indexOf(' ');

            if (spaceAfterAt === -1) {
                setMentionSearch(textAfterAt);
                setShowMentions(true);
                setMentionAnchorEl(e.target);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }

        onChange(newValue);
    };

    const handleMentionSelect = (user) => {
        const beforeMention = value.slice(0, value.lastIndexOf('@'));
        const afterMention = value.slice(cursorPosition);
        const newValue = `${beforeMention}@${user.username} ${afterMention}`;

        onChange(newValue);
        onMention(user);
        setShowMentions(false);

        // Focus back on input and place cursor after mention
        if (inputRef.current) {
            const newCursorPos = beforeMention.length + user.username.length + 2;
            setTimeout(() => {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }
    };

    return (
        <>
            <Box
                component="div"
                contentEditable
                ref={inputRef}
                onInput={handleInput}
                sx={{
                    width: '100%',
                    minHeight: '40px',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    '&:focus': {
                        outline: 'none',
                        borderColor: 'primary.main'
                    },
                    '&:empty:before': {
                        content: `"${placeholder}"`,
                        color: 'text.secondary'
                    }
                }}
                dangerouslySetInnerHTML={{ __html: value }}
            />

            <Popper
                open={showMentions && filteredUsers.length > 0}
                anchorEl={mentionAnchorEl}
                placement="bottom-start"
                style={{ zIndex: 1300 }}
            >
                <AnimatePresence>
                    {showMentions && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Paper
                                elevation={3}
                                sx={{
                                    maxHeight: 200,
                                    overflow: 'auto',
                                    mt: 1
                                }}
                            >
                                <List dense>
                                    {filteredUsers.map((user) => (
                                        <ListItem
                                            key={user.id}
                                            button
                                            onClick={() => handleMentionSelect(user)}
                                            sx={{
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={user.avatar}
                                                    alt={user.username}
                                                    sx={{ width: 24, height: 24 }}
                                                >
                                                    {user.username[0].toUpperCase()}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={user.username}
                                                secondary={user.status}
                                                primaryTypographyProps={{
                                                    variant: 'body2'
                                                }}
                                                secondaryTypographyProps={{
                                                    variant: 'caption'
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Popper>
        </>
    );
};

export default MentionInput; 