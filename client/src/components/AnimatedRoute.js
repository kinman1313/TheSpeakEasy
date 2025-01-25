import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

// Define transition variants
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

// AnimatedRoute component
const AnimatedRoute = ({ children, type = 'slide' }) => {
    // Handle invalid transition type
    const transitionType = transitions[type] ? type : 'slide';

    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={transitions[transitionType]}
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

// Prop types validation
AnimatedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    type: PropTypes.oneOf(['slide', 'fade', 'scale'])
};

// Default props
AnimatedRoute.defaultProps = {
    type: 'slide'
};

export default AnimatedRoute;