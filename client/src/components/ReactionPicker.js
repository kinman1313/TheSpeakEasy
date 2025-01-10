import React from 'react';
import { Box, IconButton, Tooltip, Popover } from '@mui/material';
import { AddReaction as AddReactionIcon } from '@mui/icons-material';

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const ReactionPicker = ({ open, anchorEl, onClose, onSelect }) => {
    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
        >
            <Box sx={{ display: 'flex', p: 1, gap: 0.5 }}>
                {commonEmojis.map((emoji) => (
                    <IconButton
                        key={emoji}
                        size="small"
                        onClick={() => {
                            onSelect(emoji);
                            onClose();
                        }}
                    >
                        {emoji}
                    </IconButton>
                ))}
            </Box>
        </Popover>
    );
};

export const ReactionButton = ({ onReactionSelect }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Tooltip title="Add reaction">
                <IconButton size="small" onClick={handleClick}>
                    <AddReactionIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <ReactionPicker
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                onSelect={onReactionSelect}
            />
        </>
    );
};

export default ReactionPicker; 