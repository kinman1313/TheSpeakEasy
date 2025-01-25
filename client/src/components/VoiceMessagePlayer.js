import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';

export default function VoiceMessagePlayer({ url }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(new Audio(url));
    const intervalRef = useRef();

    useEffect(() => {
        const audio = audioRef.current;

        const setAudioData = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            clearInterval(intervalRef.current);
        };

        // Add event listeners
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        // Cleanup
        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
            clearInterval(intervalRef.current);
        };
    }, []);

    const formatTime = (time) => {
        if (!time) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        if (!isPlaying) {
            audioRef.current.play();
            intervalRef.current = setInterval(() => {
                setCurrentTime(audioRef.current.currentTime);
            }, 100);
        } else {
            audioRef.current.pause();
            clearInterval(intervalRef.current);
        }
        setIsPlaying(!isPlaying);
    };

    const handleSliderChange = (_, value) => {
        clearInterval(intervalRef.current);
        audioRef.current.currentTime = value;
        setCurrentTime(value);
        if (!isPlaying) {
            togglePlay();
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1,
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            width: '100%',
            maxWidth: 400
        }}>
            <IconButton
                onClick={togglePlay}
                sx={{
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
            >
                {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            <Box sx={{ flex: 1 }}>
                <Slider
                    value={currentTime}
                    max={duration}
                    onChange={handleSliderChange}
                    sx={{
                        color: 'white',
                        '& .MuiSlider-thumb': {
                            width: 12,
                            height: 12,
                            '&:hover, &.Mui-focusVisible': {
                                boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)'
                            }
                        },
                        '& .MuiSlider-rail': {
                            opacity: 0.28
                        }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {formatTime(currentTime)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {formatTime(duration)}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}