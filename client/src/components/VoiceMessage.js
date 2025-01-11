import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Mic as MicIcon, Stop as StopIcon, Delete as DeleteIcon, Send as SendIcon } from '@mui/icons-material';

export default function VoiceMessage({ onSend, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [duration, setDuration] = useState(0);
    const [hasPermission, setHasPermission] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const startTimeRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        requestMicrophonePermission();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            stopRecording();
        };
    }, []);

    const requestMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setHasPermission(true);
            setupMediaRecorder(stream);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setHasPermission(false);
        }
    };

    const setupMediaRecorder = (stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = handleDataAvailable;
        mediaRecorderRef.current.onstop = handleStop;
    };

    const handleDataAvailable = (event) => {
        if (event.data.size > 0) {
            chunksRef.current.push(event.data);
        }
    };

    const handleStop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        chunksRef.current = [];
    };

    const startRecording = () => {
        if (!mediaRecorderRef.current) return;
        chunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(updateDuration, 100);
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const updateDuration = () => {
        const elapsed = Date.now() - startTimeRef.current;
        setDuration(elapsed / 1000);
    };

    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob);
        }
    };

    const handleReset = () => {
        setAudioBlob(null);
        setDuration(0);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (hasPermission === false) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">
                    Microphone access denied. Please enable microphone access to record voice messages.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <DialogTitle>Record Voice Message</DialogTitle>
            <DialogContent>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    p: 2
                }}>
                    <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isRecording ? 'error.main' : 'primary.main',
                        transition: 'all 0.3s ease',
                        transform: isRecording ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isRecording ? '0 0 20px rgba(255, 0, 0, 0.5)' : 'none'
                    }}>
                        <IconButton
                            onClick={isRecording ? stopRecording : startRecording}
                            sx={{
                                color: 'white',
                                '&:hover': { bgcolor: 'transparent' }
                            }}
                        >
                            {isRecording ? <StopIcon fontSize="large" /> : <MicIcon fontSize="large" />}
                        </IconButton>
                    </Box>

                    <Typography variant="h6">
                        {isRecording ? 'Recording...' : audioBlob ? 'Ready to send' : 'Click to start'}
                    </Typography>

                    <Typography variant="body2" color="textSecondary">
                        {formatDuration(duration)}
                    </Typography>

                    {isRecording && (
                        <LinearProgress
                            sx={{
                                width: '100%',
                                height: 4,
                                borderRadius: 2
                            }}
                        />
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                    Cancel
                </Button>
                {audioBlob && (
                    <>
                        <IconButton
                            onClick={handleReset}
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                            <DeleteIcon />
                        </IconButton>
                        <Button
                            variant="contained"
                            onClick={handleSend}
                            startIcon={<SendIcon />}
                            sx={{
                                bgcolor: 'primary.main',
                                '&:hover': { bgcolor: 'primary.dark' }
                            }}
                        >
                            Send
                        </Button>
                    </>
                )}
            </DialogActions>
        </>
    );
} 