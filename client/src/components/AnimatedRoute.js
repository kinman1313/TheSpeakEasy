import React from 'react';
import { motion } from 'framer-motion';

const transitions = {
    slide: {
        initial: { opacity: 0, x: -20 },
        in: { opacity: 1, x: 0 },
        out: { opacity: 0, x: 20 }
    },
    fade: {
        initial: { opacity: 0 },
        in: { opacity: 1 },
        out: { opacity: 0 }
    },
    scale: {
        initial: { opacity: 0, scale: 0.8 },
        in: { opacity: 1, scale: 1 },
        out: { opacity: 0, scale: 1.2 }
    }
};

const AnimatedRoute = ({ children, type = 'slide' }) => {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={transitions[type]}
            transition={{
                type: 'tween',
                ease: 'anticipate',
                duration: 0.3
            }}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedRoute; 