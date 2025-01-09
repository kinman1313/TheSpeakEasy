import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    ImageList,
    ImageListItem,
    Paper,
    Typography,
    CircularProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const GIPHY_API_KEY = 'DO7ARGJtRRks2yxeAvolAIBFJqM74EPV';
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

const GifPicker = ({ onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGifs = async (endpoint, params) => {
        try {
            setLoading(true);
            setError(null);
            const queryParams = new URLSearchParams({
                api_key: GIPHY_API_KEY,
                limit: 20,
                ...params
            });
            const response = await fetch(`${GIPHY_API_URL}/${endpoint}?${queryParams}`);
            const data = await response.json();
            setGifs(data.data);
        } catch (err) {
            setError('Failed to load GIFs');
            console.error('Error fetching GIFs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGifs('trending');
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            fetchGifs('search', { q: searchQuery.trim() });
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    const handleGifSelect = (gif) => {
        onSelect({
            url: gif.images.fixed_height.url,
            width: gif.images.fixed_height.width,
            height: gif.images.fixed_height.height,
            title: gif.title
        });
        onClose();
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    maxHeight: '70vh',
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">
                        Select a GIF
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search GIFs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        InputProps={{
                            endAdornment: (
                                <IconButton
                                    size="small"
                                    onClick={handleSearch}
                                    disabled={loading}
                                >
                                    <SearchIcon />
                                </IconButton>
                            )
                        }}
                    />
                </Box>

                {error && (
                    <Typography color="error" variant="body2" align="center">
                        {error}
                    </Typography>
                )}

                <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <ImageList cols={3} gap={8} sx={{ m: 0 }}>
                            {gifs.map((gif) => (
                                <ImageListItem
                                    key={gif.id}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            opacity: 0.8,
                                            transform: 'scale(1.02)',
                                            transition: 'all 0.2s ease-in-out'
                                        }
                                    }}
                                    onClick={() => handleGifSelect(gif)}
                                >
                                    <img
                                        src={gif.images.fixed_height.url}
                                        alt={gif.title}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

export default GifPicker; 