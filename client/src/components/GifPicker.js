import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    TextField,
    IconButton,
    ImageList,
    ImageListItem,
    Paper,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const GIPHY_API_KEY = 'DO7ARGJtRRks2yxeAvolAIBFJqM74EPV';
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

const GifPicker = ({ onSelect, onClose }) => {
    const [gifs, setGifs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGifs = useCallback(async (query) => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = query
                ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;

            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error('Failed to fetch GIFs');
            }

            const data = await response.json();
<<<<<<< HEAD
            if (response.ok) {
                setGifs(data.data);
            } else {
                setError(data.message || 'Failed to load GIFs');
            }
=======
            setGifs(data.data || []);
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
        } catch (err) {
            console.error('Error fetching GIFs:', err);
            setError('Failed to load GIFs. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGifs();
    }, [fetchGifs]);

    const handleSearch = useCallback((e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query) {
            fetchGifs(query);
        } else {
            fetchGifs();
        }
    }, [fetchGifs]);

    const handleGifSelect = useCallback((gif) => {
        if (typeof onSelect === 'function') {
            onSelect({
                type: 'gif',
                content: gif.images.original.url,
                metadata: {
                    id: gif.id,
                    title: gif.title,
                    preview: gif.images.fixed_height.url
                }
            });
            if (typeof onClose === 'function') {
                onClose();
            }
        }
    }, [onSelect, onClose]);

    return (
        <Box sx={{
            width: '100%',
            maxWidth: 500,
            maxHeight: '70vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 2,
            backgroundColor: 'rgba(17, 25, 40, 0.75)',
            backdropFilter: 'blur(16px) saturate(180%)',
            borderRadius: 2,
            border: '1px solid rgba(255, 255, 255, 0.125)'
        }}>
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Search GIFs..."
                value={searchQuery}
                onChange={handleSearch}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.23)'
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.4)'
                        }
                    }
                }}
<<<<<<< HEAD
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">
                        Select a GIF
                    </Typography>
                    <IconButton onClick={onClose} size="small" aria-label="close">
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
                                    aria-label="search"
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
                                    aria-label={`select ${gif.title}`}
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
=======
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
>>>>>>> d031dbd8773ab07cd257f9851181f0649c627a54
                </Box>
            ) : (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 2,
                    overflowY: 'auto',
                    maxHeight: 'calc(70vh - 100px)',
                    p: 1
                }}>
                    {gifs.map((gif) => (
                        <Box
                            key={gif.id}
                            component="img"
                            src={gif.images.fixed_height.url}
                            alt={gif.title}
                            onClick={() => handleGifSelect(gif)}
                            sx={{
                                width: '100%',
                                height: 'auto',
                                cursor: 'pointer',
                                borderRadius: 1,
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.05)'
                                }
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default GifPicker;

