import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Tooltip,
    Paper,
    Switch,
    FormControlLabel,
    Divider
} from '@mui/material';
import {
    Schedule as ScheduleIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
    Repeat as RepeatIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion, AnimatePresence } from 'framer-motion';

const MessageScheduler = ({
    onSchedule,
    onEdit,
    onDelete,
    scheduledMessages = []
}) => {
    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [message, setMessage] = useState('');
    const [repeat, setRepeat] = useState({
        enabled: false,
        interval: 'daily',
        endDate: null
    });
    const [editingMessage, setEditingMessage] = useState(null);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setMessage('');
        setSelectedDate(new Date());
        setRepeat({
            enabled: false,
            interval: 'daily',
            endDate: null
        });
        setEditingMessage(null);
    };

    const handleSchedule = () => {
        const scheduleData = {
            id: editingMessage?.id || Date.now(),
            message,
            scheduledDate: selectedDate,
            repeat: repeat.enabled ? repeat : null,
            status: 'pending'
        };

        if (editingMessage) {
            onEdit(scheduleData);
        } else {
            onSchedule(scheduleData);
        }

        handleClose();
    };

    const handleEdit = (message) => {
        setEditingMessage(message);
        setMessage(message.message);
        setSelectedDate(new Date(message.scheduledDate));
        setRepeat(message.repeat || {
            enabled: false,
            interval: 'daily',
            endDate: null
        });
        setOpen(true);
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString();
    };

    const getRepeatText = (repeat) => {
        if (!repeat?.enabled) return 'No repeat';
        return `Repeats ${repeat.interval} until ${repeat.endDate ? formatDateTime(repeat.endDate) : 'forever'}`;
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Paper elevation={3} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Scheduled Messages
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<ScheduleIcon />}
                        onClick={handleOpen}
                    >
                        Schedule New
                    </Button>
                </Box>

                <List>
                    {scheduledMessages.map((msg) => (
                        <React.Fragment key={msg.id}>
                            <ListItem>
                                <ListItemText
                                    primary={msg.message}
                                    secondary={
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {formatDateTime(msg.scheduledDate)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <RepeatIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {getRepeatText(msg.repeat)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Tooltip title="Edit">
                                        <IconButton edge="end" onClick={() => handleEdit(msg)} sx={{ mr: 1 }}>
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton edge="end" onClick={() => onDelete(msg.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </ListItemSecondaryAction>
                            </ListItem>
                            <Divider />
                        </React.Fragment>
                    ))}
                    {scheduledMessages.length === 0 && (
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                            No scheduled messages
                        </Typography>
                    )}
                </List>
            </Paper>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {editingMessage ? 'Edit Scheduled Message' : 'Schedule New Message'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                        />

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                label="Schedule Date & Time"
                                value={selectedDate}
                                onChange={setSelectedDate}
                                minDateTime={new Date()}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </LocalizationProvider>

                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={repeat.enabled}
                                        onChange={(e) => setRepeat(prev => ({
                                            ...prev,
                                            enabled: e.target.checked
                                        }))}
                                    />
                                }
                                label="Repeat"
                            />

                            {repeat.enabled && (
                                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Repeat Interval"
                                        value={repeat.interval}
                                        onChange={(e) => setRepeat(prev => ({
                                            ...prev,
                                            interval: e.target.value
                                        }))}
                                        SelectProps={{
                                            native: true
                                        }}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </TextField>

                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DateTimePicker
                                            label="End Date (Optional)"
                                            value={repeat.endDate}
                                            onChange={(date) => setRepeat(prev => ({
                                                ...prev,
                                                endDate: date
                                            }))}
                                            minDateTime={selectedDate}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                        />
                                    </LocalizationProvider>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSchedule}
                        disabled={!message.trim() || !selectedDate}
                    >
                        {editingMessage ? 'Update' : 'Schedule'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MessageScheduler; 