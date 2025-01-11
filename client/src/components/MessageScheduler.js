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