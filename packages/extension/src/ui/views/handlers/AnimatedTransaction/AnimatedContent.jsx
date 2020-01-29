import React from 'react';
import PropTypes from 'prop-types';
import posed, { PoseGroup } from 'react-pose';

const PoseAnimation = posed.div({
    enter: {
        x: 0,
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            x: { type: 'spring', stiffness: 100, damping: 50 },
            default: { duration: 330 },
        },
    },
    left: {
        x: '-50%',
        opacity: 0,
        transition: {
            x: { type: 'spring', stiffness: 100, damping: 50 },
            default: { duration: 330 },
        },
    },
    right: {
        x: '50%',
        opacity: 0,
        transition: {
            x: { type: 'spring', stiffness: 100, damping: 50 },
            default: { duration: 330 },
        },
    },
    fadeIn: {
        opacity: 1,
        default: { duration: 330, delay: 330 },
    },
    hide: {
        opacity: 0,
    },
    fromBottom: {
        y: '-100%',
        scale: 0.4,
        opacity: 0,
        transition: {
            y: { type: 'spring', stiffness: 100, damping: 50 },
            scale: { type: 'spring', stiffness: 100, damping: 50 },
            default: { duration: 330, delay: 1000 },
        },

    },
    fadeOut: {
        opacity: 0,
        default: { duration: 330 },
    },
});

const animationMap = {
    content: {
        exitPose: {
            1: 'left',
            '-1': 'right',
        },
        preEnterPose: {
            1: 'right',
            '-1': 'left',
        },
        style: {
            overflow: 'hidden',
            width: '100%',
        },
    },
    popup: {
        exitPose: {
            1: 'fromBottom',
        },
        preEnterPose: {
            1: 'fromBottom',
        },
        style: {},
    },
    'popup-content': {
        exitPose: {
            1: 'fadeOut',
            '-1': 'fadeOut',
        },
        preEnterPose: {
            1: 'hide',
            '-1': 'hide',
        },
        style: {

        },
    },
    overlay: {
        exitPose: {
            1: 'fadeOut',
        },
        preEnterPose: {
            1: 'hide',
        },
        style: {

        },
    },
    header: {
        exitPose: {
            1: 'fadeOut',
            '-1': 'fadeOut',
        },
        preEnterPose: {
            1: 'hide',
            '-1': 'hide',
        },
        style: {
            width: '100%',
        },
    },
    footer: {
        exitPose: {
            1: 'fadeOut',
            '-1': 'fadeOut',
        },
        preEnterPose: {
            1: 'hide',
            '-1': 'hide',
        },
        style: {
            width: '100%',
        },
    },
};


const AnimatedContent = ({
    direction,
    animationKey,
    animationType,
    children,
    className,
}) => (
    <PoseGroup
        className={className}
        preEnterPose={animationMap[animationType].preEnterPose[direction]}
        exitPose={animationMap[animationType].exitPose[direction]}
        style={animationMap[animationType].style}
    >
        <PoseAnimation key={animationKey}>
            {children}
        </PoseAnimation>
    </PoseGroup>
);

AnimatedContent.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string.isRequired,
    direction: PropTypes.string,
    animationKey: PropTypes.number.isRequired,
    animationType: PropTypes.string.isRequired,
};

AnimatedContent.defaultProps = {
    children: null,
    direction: '1',
};

export default AnimatedContent;
