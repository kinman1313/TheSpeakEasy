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

    const handleEditSubmit = () => {
        onEdit(editedText);
        setEditDialogOpen(false);
    };

    const handleDeleteConfirm = () => {
        onDelete();
        setDeleteDialogOpen(false);
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
                <MenuItem onClick={handleReplyClick}>
                    <ReplyIcon fontSize="small" sx={{ mr: 1 }} />
                    Reply
                </MenuItem>
                {isOwner && (
                    <>
                        <MenuItem onClick={handleEditClick}>
                            <EditIcon fontSize="small" sx={{ mr: 1 }} />
                            Edit
                        </MenuItem>
                        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
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
            >
                <DialogTitle>Edit Message</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        variant="outlined"
                        margin="dense"
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
            >
                <DialogTitle>Delete Message</DialogTitle>
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