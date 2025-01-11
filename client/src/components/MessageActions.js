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