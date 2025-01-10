import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, Paper, Dialog, CircularProgress } from '@mui/material';
import { Close as CloseIcon, Mic as MicIcon, Stop as StopIcon, Send as SendIcon } from '@mui/icons-material';

export default function VoiceMessage({ onSend, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [loading, setLoading] = useState(false);
    const mediaRecorder = useRef(null);
    const timerInterval = useRef(null);
    const audioChunks = useRef([]);

    useEffect(() => {
        // Request microphone permission on component mount
        const requestMicrophonePermission = async () => {
            try {
                setLoading(true);
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setPermissionGranted(true);
                stream.getTracks().forEach(track => track.stop()); // Stop initial stream
            } catch (error) {
                console.error('Error accessing microphone:', error);
                setPermissionGranted(false);
            } finally {
                setLoading(false);
            }
        };
        requestMicrophonePermission();
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, {
                    type: 'audio/webm;codecs=opus'
                });
                console.log('Created audio blob:', audioBlob);
                setAudioBlob(audioBlob);
            };

            mediaRecorder.current.start(100);
            setIsRecording(true);
            startTimer();
        } catch (error) {
            console.error('Error starting recording:', error);
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
            onSend(audioBlob);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Dialog open={true} PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
                <CircularProgress sx={{ color: '#f3d77f' }} />
            </Dialog>
        );
    }

    return (
        <Dialog
            open={true}
            onClose={onClose}
            PaperProps={{
                sx: {
                    bgcolor: 'rgba(10, 25, 41, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(243, 215, 127, 0.1)',
                    borderRadius: 2,
                    minWidth: 300,
                    color: 'white'
                }
            }}
        >
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#f3d77f' }}>Voice Message</Typography>
                    <IconButton onClick={onClose} size="small" sx={{ color: '#f3d77f' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {!permissionGranted ? (
                    <Typography color="error" sx={{ textAlign: 'center', my: 2 }}>
                        Please allow microphone access to record voice messages
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Paper
                            elevation={3}
                            sx={{
                                width: '100%',
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderRadius: 2,
                                bgcolor: isRecording ? 'rgba(243, 215, 127, 0.1)' : 'rgba(10, 25, 41, 0.6)',
                                border: '1px solid rgba(243, 215, 127, 0.1)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <Typography sx={{ color: '#f3d77f' }}>
                                {isRecording ? formatTime(recordingTime) : 'Ready to record'}
                            </Typography>
                            <IconButton
                                color="primary"
                                onClick={isRecording ? stopRecording : startRecording}
                                sx={{
                                    color: '#f3d77f',
                                    '&:hover': {
                                        bgcolor: 'rgba(243, 215, 127, 0.1)'
                                    }
                                }}
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
                                        backgroundColor: 'rgba(243, 215, 127, 0.1)'
                                    }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    <IconButton
                                        onClick={handleSend}
                                        sx={{
                                            color: '#f3d77f',
                                            '&:hover': {
                                                bgcolor: 'rgba(243, 215, 127, 0.1)'
                                            }
                                        }}
                                    >
                                        <SendIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Dialog>
    );
} 