import React, { useState, useRef } from 'react';
import {
    Box,
    IconButton,
    Typography,
    LinearProgress,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    Button
} from '@mui/material';
import {
    AttachFile as AttachFileIcon,
    Image as ImageIcon,
    Description as DocumentIcon,
    Movie as VideoIcon,
    AudioFile as AudioIcon,
    Close as CloseIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('video/')) return <VideoIcon />;
    if (type.startsWith('audio/')) return <AudioIcon />;
    return <DocumentIcon />;
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload = ({ onUpload, maxSize = 10 * 1024 * 1024, allowedTypes = ['image/*', 'application/pdf'] }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef();

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files);
        const validFiles = selectedFiles.filter(file => {
            // Check file size
            if (file.size > maxSize) {
                setError(`File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`);
                return false;
            }

            // Check file type
            const isValidType = allowedTypes.some(type => {
                if (type.endsWith('/*')) {
                    return file.type.startsWith(type.slice(0, -2));
                }
                return file.type === type;
            });

            if (!isValidType) {
                setError(`File ${file.name} is not an allowed type`);
                return false;
            }

            return true;
        });

        setFiles(prevFiles => [...prevFiles, ...validFiles]);
        setError(null);
    };

    const handleRemoveFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const handlePreview = (file) => {
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setPreviewOpen(true);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setProgress(0);

        try {
            const uploadPromises = files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    }
                });

                if (!response.ok) throw new Error('Upload failed');

                const data = await response.json();
                return data;
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            onUpload(uploadedFiles);
            setFiles([]);
            setProgress(100);
        } catch (err) {
            setError('Failed to upload files. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Box>
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept={allowedTypes.join(',')}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <IconButton
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                    >
                        <AttachFileIcon />
                    </IconButton>
                    <Typography variant="caption" color="text.secondary">
                        Max size: {formatFileSize(maxSize)}
                    </Typography>
                </Box>

                {error && (
                    <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                        {error}
                    </Typography>
                )}

                <AnimatePresence>
                    {files.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            <Paper variant="outlined" sx={{ mt: 2 }}>
                                <List dense>
                                    {files.map((file, index) => (
                                        <ListItem
                                            key={index}
                                            button={file.type.startsWith('image/')}
                                            onClick={() => file.type.startsWith('image/') && handlePreview(file)}
                                        >
                                            <ListItemIcon>
                                                {getFileIcon(file.type)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={formatFileSize(file.size)}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleRemoveFile(index)}
                                                    disabled={uploading}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>

                                {uploading && (
                                    <Box sx={{ px: 2, pb: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{ mt: 1 }}
                                        />
                                    </Box>
                                )}

                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<CloudUploadIcon />}
                                        onClick={handleUpload}
                                        disabled={uploading}
                                    >
                                        Upload
                                    </Button>
                                </Box>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Preview
                    <IconButton
                        onClick={() => setPreviewOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box
                        component="img"
                        src={previewUrl}
                        alt="Preview"
                        sx={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '70vh',
                            objectFit: 'contain'
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FileUpload; 