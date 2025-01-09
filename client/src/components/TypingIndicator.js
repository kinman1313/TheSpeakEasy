import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const TypingIndicator = ({ users }) => {
    if (!users || users.length === 0) return null;

    const text = users.length === 1
        ? `${users[0]} is typing...`
        : users.length === 2
            ? `${users[0]} and ${users[1]} are typing...`
            : `${users[0]} and ${users.length - 1} others are typing...`;

    return (
        <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
            >
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center' }}
                >
                    {text}
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            transition: {
                                duration: 1.5,
                                repeat: Infinity,
                            },
                        }}
                    >
                        ...
                    </motion.span>
                </Typography>
            </motion.div>
        </Box>
    );
};

export default TypingIndicator; 