import React, { useState } from 'react';
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Slider,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField
} from '@mui/material';
import { HexColorPicker } from 'react-colorful';

export default function ChatBubbleCustomizer({ open, onClose, onSave, initialSettings }) {
    const [settings, setSettings] = useState(initialSettings || {
        type: 'solid',
        color1: '#1a1a40',
        color2: '#4a4a80',
        gradientDirection: '135deg',
        opacity: 0.75,
        blur: 16,
        border: 'rgba(255, 255, 255, 0.125)'
    });

    const [activeColor, setActiveColor] = useState('color1');

    const handleColorChange = (color) => {
        setSettings(prev => ({
            ...prev,
            [activeColor]: color
        }));
    };

    const handleTypeChange = (event) => {
        setSettings(prev => ({
            ...prev,
            type: event.target.value
        }));
    };

    const handleDirectionChange = (event) => {
        setSettings(prev => ({
            ...prev,
            gradientDirection: event.target.value
        }));
    };

    const getPreviewStyle = () => {
        const baseStyle = {
            backdropFilter: `blur(${settings.blur}px) saturate(180%)`,
            WebkitBackdropFilter: `blur(${settings.blur}px) saturate(180%)`,
            border: `1px solid ${settings.border}`,
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '80%',
            margin: '8px'
        };

        if (settings.type === 'solid') {
            return {
                ...baseStyle,
                backgroundColor: `${settings.color1}${Math.round(settings.opacity * 255).toString(16).padStart(2, '0')}`
            };
        } else {
            return {
                ...baseStyle,
                background: `linear-gradient(${settings.gradientDirection}, ${settings.color1}${Math.round(settings.opacity * 255).toString(16).padStart(2, '0')}, ${settings.color2}${Math.round(settings.opacity * 255).toString(16).padStart(2, '0')})`
            };
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            PaperProps={{
                sx: {
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    backgroundColor: 'rgba(17, 25, 40, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.125)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    borderRadius: '12px',
                    color: 'white'
                }
            }}
        >
            <DialogTitle>Customize Chat Bubbles</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', gap: 4, p: 2 }}>
                    {/* Left side - Controls */}
                    <Box sx={{ width: '250px' }}>
                        <Typography gutterBottom>Style Type</Typography>
                        <RadioGroup value={settings.type} onChange={handleTypeChange}>
                            <FormControlLabel
                                value="solid"
                                control={<Radio sx={{ color: 'white' }} />}
                                label="Solid Color"
                            />
                            <FormControlLabel
                                value="gradient"
                                control={<Radio sx={{ color: 'white' }} />}
                                label="Gradient"
                            />
                        </RadioGroup>

                        {settings.type === 'gradient' && (
                            <>
                                <Typography gutterBottom sx={{ mt: 2 }}>Gradient Direction</Typography>
                                <TextField
                                    select
                                    fullWidth
                                    value={settings.gradientDirection}
                                    onChange={handleDirectionChange}
                                    SelectProps={{
                                        native: true,
                                        sx: { color: 'white' }
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: 'white',
                                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' }
                                        }
                                    }}
                                >
                                    <option value="45deg">↗️ Top Right</option>
                                    <option value="135deg">↘️ Bottom Right</option>
                                    <option value="225deg">↙️ Bottom Left</option>
                                    <option value="315deg">↖️ Top Left</option>
                                    <option value="to right">➡️ Right</option>
                                    <option value="to left">⬅️ Left</option>
                                    <option value="to bottom">⬇️ Bottom</option>
                                    <option value="to top">⬆️ Top</option>
                                </TextField>
                            </>
                        )}

                        <Typography gutterBottom sx={{ mt: 2 }}>Opacity</Typography>
                        <Slider
                            value={settings.opacity}
                            onChange={(_, value) => setSettings(prev => ({ ...prev, opacity: value }))}
                            min={0}
                            max={1}
                            step={0.01}
                            sx={{ color: 'white' }}
                        />

                        <Typography gutterBottom sx={{ mt: 2 }}>Blur</Typography>
                        <Slider
                            value={settings.blur}
                            onChange={(_, value) => setSettings(prev => ({ ...prev, blur: value }))}
                            min={0}
                            max={32}
                            sx={{ color: 'white' }}
                        />
                    </Box>

                    {/* Middle - Color Picker */}
                    <Box sx={{ width: '200px' }}>
                        <Typography gutterBottom>
                            {settings.type === 'gradient' ?
                                (activeColor === 'color1' ? 'Start Color' : 'End Color') :
                                'Color'}
                        </Typography>
                        <HexColorPicker
                            color={settings[activeColor]}
                            onChange={handleColorChange}
                        />
                        {settings.type === 'gradient' && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <Button
                                    variant={activeColor === 'color1' ? 'contained' : 'outlined'}
                                    onClick={() => setActiveColor('color1')}
                                    sx={{ flex: 1 }}
                                >
                                    Color 1
                                </Button>
                                <Button
                                    variant={activeColor === 'color2' ? 'contained' : 'outlined'}
                                    onClick={() => setActiveColor('color2')}
                                    sx={{ flex: 1 }}
                                >
                                    Color 2
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* Right side - Preview */}
                    <Box sx={{ width: '300px' }}>
                        <Typography gutterBottom>Preview</Typography>
                        <Box sx={{
                            minHeight: '200px',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '12px',
                            padding: '16px'
                        }}>
                            <Box sx={getPreviewStyle()}>
                                <Typography sx={{ color: 'white' }}>
                                    This is how your messages will look
                                </Typography>
                            </Box>
                            <Box sx={{
                                ...getPreviewStyle(),
                                marginLeft: 'auto',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }}>
                                <Typography sx={{ color: 'white' }}>
                                    This is how others' messages will look
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} sx={{ color: 'white' }}>
                    Cancel
                </Button>
                <Button
                    onClick={() => onSave(settings)}
                    variant="contained"
                    sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)'
                        }
                    }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
} 