import React, { useState, useRef } from 'react';
import { Box, IconButton, Typography, Paper, Dialog } from '@mui/material';
import { Close as CloseIcon, Mic as MicIcon, Stop as StopIcon, Send as SendIcon } from '@mui/icons-material';

export default function VoiceMessage({ onSend, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorder = useRef(null);
    const timerInterval = useRef(null);
    const audioChunks = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
                setAudioBlob(audioBlob);
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            startTimer();
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            stopTimer();
        }
    };

    const startTimer = () => {
        setRecordingTime(0);
        timerInterval.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
        }
    };

    const handleSend = () => {
        if (audioBlob) {
            const audioUrl = URL.createObjectURL(audioBlob);
            onSend(audioUrl);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog
            open={true}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minWidth: 300
                }
            }}
        >
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Voice Message</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            width: '100%',
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: 2,
                            bgcolor: isRecording ? 'error.light' : 'background.paper'
                        }}
                    >
                        <Typography>
                            {isRecording ? formatTime(recordingTime) : 'Ready to record'}
                        </Typography>
                        <IconButton
                            color={isRecording ? 'error' : 'primary'}
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            {isRecording ? <StopIcon /> : <MicIcon />}
                        </IconButton>
                    </Paper>

                    {audioBlob && (
                        <Box sx={{ width: '100%' }}>
                            <audio
                                controls
                                src={URL.createObjectURL(audioBlob)}
                                style={{
                                    width: '100%',
                                    height: 40,
                                    borderRadius: 8,
                                    backgroundColor: 'rgba(0,0,0,0.05)'
                                }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <IconButton
                                    color="primary"
                                    onClick={handleSend}
                                >
                                    <SendIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Dialog>
    );
} 