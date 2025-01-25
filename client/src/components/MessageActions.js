import React, { useRef, useEffect } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
    Delete as DeleteIcon,
    Schedule as ScheduleIcon,
    Timer as TimerIcon,
    Edit as EditIcon
} from '@mui/icons-material';

export default function MessageActions({
    anchorEl,
    open,
    onClose,
    onDelete,
    onSchedule,
    onSetVanishTimer,
    onEdit,
    canEdit
}) {
    const firstItemRef = useRef(null);

    useEffect(() => {
        // Focus the first menu item when opened
        if (open && firstItemRef.current) {
            firstItemRef.current.focus();
        }

<<<<<<< HEAD
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEditClick = () => {
        setEditDialogOpen(true);
        handleClose();
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
        handleClose();
    };

    const handleEditSubmit = async () => {
        try {
            await onEdit(editedText);
            setEditDialogOpen(false);
        } catch (error) {
            console.error('Edit error:', error);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await onDelete();
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleReplyClick = () => {
        onReply();
        handleClose();
    };

    return (
        <>
            <IconButton
                size="small"
                onClick={handleClick}
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                aria-label="message actions"
            >
                <MoreVertIcon fontSize="small" />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        bgcolor: 'background.paper',
                        boxShadow: 3
                    }
                }}
            >
                <MenuItem onClick={handleReplyClick} aria-label="reply">
                    <ReplyIcon fontSize="small" sx={{ mr: 1 }} />
                    Reply
                </MenuItem>
                {isOwner && (
                    <>
                        <MenuItem onClick={handleEditClick} aria-label="edit">
                            <EditIcon fontSize="small" sx={{ mr: 1 }} />
                            Edit
                        </MenuItem>
                        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }} aria-label="delete">
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                            Delete
                        </MenuItem>
                    </>
                )}
            </Menu>

            {/* Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                aria-labelledby="edit-dialog-title"
            >
                <DialogTitle id="edit-dialog-title">Edit Message</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        variant="outlined"
                        margin="dense"
                        aria-label="edit message"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleEditSubmit}
                        variant="contained"
                        disabled={!editedText.trim() || editedText === message.text}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                aria-labelledby="delete-dialog-title"
            >
                <DialogTitle id="delete-dialog-title">Delete Message</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this message? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        color="error"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MessageActions;

=======
        // Cleanup function to restore focus when menu closes
        return () => {
            if (!open && document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };
    }, [open]);

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            PaperProps={{
                sx: {
                    backgroundColor: 'rgba(17, 25, 40, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.125)',
                    borderRadius: 2,
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    '& .MuiMenuItem-root': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }}
        >
            {canEdit && (
                <MenuItem onClick={onEdit} ref={firstItemRef}>
                    <ListItemIcon>
                        <EditIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </ListItemIcon>
                    <ListItemText>Edit Message</ListItemText>
                </MenuItem>
            )}

            <MenuItem onClick={onSchedule} ref={!canEdit ? firstItemRef : null}>
                <ListItemIcon>
                    <ScheduleIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </ListItemIcon>
                <ListItemText>Schedule Message</ListItemText>
            </MenuItem>

            <MenuItem onClick={onSetVanishTimer}>
                <ListItemIcon>
                    <TimerIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </ListItemIcon>
                <ListItemText>Set Vanish Timer</ListItemText>
            </MenuItem>

            <MenuItem onClick={onDelete}>
                <ListItemIcon>
                    <DeleteIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </ListItemIcon>
                <ListItemText>Delete Message</ListItemText>
            </MenuItem>
        </Menu>
    );
} 
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
