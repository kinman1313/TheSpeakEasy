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
            setGifs(data.data || []);
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
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
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