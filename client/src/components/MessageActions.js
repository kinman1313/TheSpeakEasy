import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Reply as ReplyIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const MessageActions = ({ message, onEdit, onDelete, onReply }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editedText, setEditedText] = useState(message.text);
    const { user: currentUser } = useAuth();

    const isOwner = message.username === currentUser?.username;
    const open = Boolean(anchorEl);

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

