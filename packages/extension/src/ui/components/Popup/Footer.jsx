import React from 'react';
import PropTypes from 'prop-types';
import posed, { PoseGroup } from 'react-pose';
import {
    FlexBox,
    Button,
} from '@aztec/guacamole-ui';
import styles from './popup.scss';

const AnimatedButton = posed.div({
    exit: {
        opacity: 0,
    },
    enter: {
        opacity: 1,
    },
});

const Footer = ({
    cancelText,
    onNext,
    onPrevious,
    nextText,
}) => (
    <FlexBox
        valign="center"
    >
        <PoseGroup>
            <AnimatedButton>
                <Button
                    className={styles['cancel-button']}
                    text={cancelText}
                    onClick={onPrevious}
                />
            </AnimatedButton>
            <AnimatedButton>
                <Button
                    className={styles['next-button']}
                    text={nextText}
                    onClick={onNext}
                />
            </AnimatedButton>
        </PoseGroup>
    </FlexBox>
);

Footer.propTypes = {
    onNext: PropTypes.func.isRequired,
    nextText: PropTypes.string.isRequired,
    cancelText: PropTypes.string.isRequired,
    onPrevious: PropTypes.func.isRequired,
};

export default Footer;
