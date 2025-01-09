import React, { useState } from 'react';
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Switch,
    Typography,
    Box,
    Divider,
    Paper,
    Tooltip,
    Fade
} from '@mui/material';
import {
    Palette as PaletteIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    FormatPaint as FormatPaintIcon,
    Contrast as ContrastIcon,
    Style as StyleIcon
} from '@mui/icons-material';

const ThemeMenu = ({
    currentTheme = 'dark',
    onThemeChange,
    messageColor = '#7C4DFF',
    onMessageColorChange,
    bubbleStyle = 'modern',
    onBubbleStyleChange
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleThemeChange = (theme) => {
        onThemeChange(theme);
        handleClose();
    };

    const bubbleStyles = [
        { value: 'modern', label: 'Modern' },
        { value: 'classic', label: 'Classic' },
        { value: 'minimal', label: 'Minimal' }
    ];

    return (
        <>
            <Tooltip title="Theme Settings">
                <IconButton
                    onClick={handleClick}
                    color="inherit"
                    sx={{
                        transition: 'transform 0.2s',
                        '&:hover': {
                            transform: 'rotate(30deg)'
                        }
                    }}
                >
                    <PaletteIcon />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        minWidth: 320,
                        borderRadius: 2,
                        overflow: 'visible',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        }
                    }
                }}
            >
                <Box sx={{ px: 3, py: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Theme Settings
                    </Typography>
                </Box>

                <Divider />

                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Color Mode
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Paper
                            onClick={() => handleThemeChange('light')}
                            sx={{
                                p: 2,
                                flex: 1,
                                cursor: 'pointer',
                                bgcolor: currentTheme === 'light' ? 'primary.light' : 'background.paper',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: 'primary.light'
                                }
                            }}
                        >
                            <LightModeIcon />
                            <Typography>Light</Typography>
                        </Paper>
                        <Paper
                            onClick={() => handleThemeChange('dark')}
                            sx={{
                                p: 2,
                                flex: 1,
                                cursor: 'pointer',
                                bgcolor: currentTheme === 'dark' ? 'primary.light' : 'background.paper',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: 'primary.light'
                                }
                            }}
                        >
                            <DarkModeIcon />
                            <Typography>Dark</Typography>
                        </Paper>
                    </Box>
                </Box>

                <Divider />

                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Message Color
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormatPaintIcon />
                        <input
                            type="color"
                            value={messageColor}
                            onChange={(e) => onMessageColorChange(e.target.value)}
                            style={{
                                width: '100%',
                                height: 40,
                                padding: 0,
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                            }}
                        />
                    </Box>
                </Box>

                <Divider />

                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Bubble Style
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {bubbleStyles.map((style) => (
                            <Paper
                                key={style.value}
                                onClick={() => onBubbleStyleChange(style.value)}
                                sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    bgcolor: bubbleStyle === style.value ? 'primary.light' : 'background.paper',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: 'primary.light'
                                    }
                                }}
                            >
                                <StyleIcon />
                                <Typography>{style.label}</Typography>
                            </Paper>
                        ))}
                    </Box>
                </Box>
            </Menu>
        </>
    );
};

export default ThemeMenu; 