import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Button,
} from '@aztec/guacamole-ui';
import styles from './footer.scss';


const Footer = ({
    cancelText,
    onNext,
    onPrevious,
    nextText,
}) => (
    <FlexBox
        align="center"
        direction="row"
        valing="center"
        className={styles.footer}
    >
        <Button
            className={styles['cancel-button']}
            text={cancelText}
            onClick={onPrevious}
        />
        <Button
            className={styles['next-button']}
            text={nextText}
            onClick={onNext}
        />
    </FlexBox>
);

Footer.propTypes = {
    onNext: PropTypes.func.isRequired,
    nextText: PropTypes.string.isRequired,
    cancelText: PropTypes.string.isRequired,
    onPrevious: PropTypes.func.isRequired,
};

export default Footer;
