import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const TypingDots = () => (
    <Box component="span" sx={{ display: 'inline-flex', gap: 0.5, ml: 0.5 }}>
        {[0, 1, 2].map((i) => (
            <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    delay: i * 0.2,
                }}
                style={{ display: 'inline-block' }}
            >
                .
            </motion.span>
        ))}
    </Box>
);

const TypingIndicator = ({ users }) => {
    if (!users.size) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 80,
                        left: 16,
                        backgroundColor: 'background.paper',
                        borderRadius: 1,
                        boxShadow: 1,
                        p: 1,
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        {Array.from(users).join(', ')}
                        {users.size === 1 ? ' is' : ' are'} typing
                        <TypingDots />
                    </Typography>
                </Box>
            </motion.div>
        </AnimatePresence>
    );
};

export default TypingIndicator; 