import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

export default function MessageScheduler({ onSchedule, onClose }) {
    const [message, setMessage] = useState('');
    const [scheduledTime, setScheduledTime] = useState(new Date());
    const messageInputRef = useRef(null);

    // Focus management
    useEffect(() => {
        // Focus the message input when component mounts
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }

        // Cleanup function to restore focus when component unmounts
        return () => {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && scheduledTime) {
            onSchedule(message, scheduledTime);
            setMessage('');
            setScheduledTime(new Date());
            onClose?.();
        }
    };

    return (
<<<<<<< HEAD
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
                        aria-label="schedule new message"
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
                                        <IconButton edge="end" onClick={() => handleEdit(msg)} sx={{ mr: 1 }} aria-label="edit message">
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton edge="end" onClick={() => onDelete(msg.id)} aria-label="delete message">
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
                aria-labelledby="schedule-dialog-title"
            >
                <DialogTitle id="schedule-dialog-title">
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
                            aria-label="message input"
                        />

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                label="Schedule Date & Time"
                                value={selectedDate}
                                onChange={setSelectedDate}
                                minDateTime={new Date()}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                                aria-label="schedule date and time"
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
                                        aria-label="repeat switch"
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
                                        aria-label="repeat interval"
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
                                            aria-label="end date"
                                        />
                                    </LocalizationProvider>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} aria-label="cancel">Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSchedule}
                        disabled={!message.trim() || !selectedDate}
                        aria-label="schedule message"
                    >
                        {editingMessage ? 'Update' : 'Schedule'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MessageScheduler;





=======
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    p: 2,
                    minWidth: 300
                }}
            >
                <TextField
                    inputRef={messageInputRef}
                    label="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                    required
                    sx={{
                        '& .MuiInputBase-input': {
                            color: 'rgba(255, 255, 255, 0.9)'
                        },
                        '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.23)'
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.4)'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.7)'
                            }
                        }
                    }}
                />

                <DateTimePicker
                    label="Schedule Time"
                    value={scheduledTime}
                    onChange={(newValue) => setScheduledTime(newValue)}
                    minDateTime={new Date()}
                    sx={{
                        '& .MuiInputBase-input': {
                            color: 'rgba(255, 255, 255, 0.9)'
                        },
                        '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.23)'
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.4)'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.7)'
                            }
                        }
                    }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    disabled={!message.trim() || !scheduledTime}
                    sx={{
                        mt: 2,
                        backdropFilter: 'blur(20px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)'
                        },
                        '&:disabled': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'rgba(255, 255, 255, 0.3)'
                        }
                    }}
                >
                    Schedule Message
                </Button>
            </Box>
        </LocalizationProvider>
    );
} 
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
