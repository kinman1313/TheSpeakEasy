import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, LinearProgress, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Mic as MicIcon, Stop as StopIcon, Delete as DeleteIcon, Send as SendIcon } from '@mui/icons-material';

export default function VoiceMessage({ onComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [duration, setDuration] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    useEffect(() => {
        const setupRecorder = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setPermissionGranted(true);
                setError(null);

                const recorder = new MediaRecorder(stream);
                const chunks = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunks.push(e.data);
                    }
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    setAudioBlob(blob);
                    setIsRecording(false);
                };

                setMediaRecorder(recorder);
            } catch (err) {
                console.error('Error accessing microphone:', err);
                setError('Could not access microphone. Please check permissions.');
                setPermissionGranted(false);
            }
        };

        setupRecorder();

        return () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
        };
    }, []);

    const startRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'inactive') {
            setAudioBlob(null);
            setDuration(0);
            setIsRecording(true);
            mediaRecorder.start();
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    };

    const handleSend = () => {
        if (audioBlob) {
            onComplete(audioBlob);
            resetRecording();
        }
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setDuration(0);
        setIsRecording(false);
    };

    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <DialogTitle>Record Voice Message</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', my: 2 }}>
                    {isRecording && (
                        <Box sx={{ width: '100%', mb: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={(duration % 60) * (100 / 60)}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: 'rgba(255, 82, 82, 0.8)',
                                    }
                                }}
                            />
                            <Typography variant="caption" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                                Recording: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                            </Typography>
                        </Box>
                    )}

                    {!audioBlob ? (
                        <Button
                            variant="contained"
                            color={isRecording ? "error" : "primary"}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={!permissionGranted}
                            startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                            sx={{
                                backdropFilter: 'blur(20px)',
                                backgroundColor: isRecording ? 'rgba(255, 82, 82, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                                '&:hover': {
                                    backgroundColor: isRecording ? 'rgba(255, 82, 82, 0.9)' : 'rgba(255, 255, 255, 0.2)'
                                }
                            }}
                        >
                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </Button>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={resetRecording}
                                startIcon={<DeleteIcon />}
                                sx={{
                                    backdropFilter: 'blur(20px)',
                                    backgroundColor: 'rgba(255, 82, 82, 0.8)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 82, 82, 0.9)'
                                    }
                                }}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSend}
                                startIcon={<SendIcon />}
                                sx={{
                                    backdropFilter: 'blur(20px)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                    }
                                }}
                            >
                                Send
                            </Button>
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Box>
    );
} 