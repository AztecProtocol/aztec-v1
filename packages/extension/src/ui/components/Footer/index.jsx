import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
} from '@aztec/guacamole-ui';
import Button from '~ui/components/Button';
import styles from './footer.scss';


const Footer = ({
    cancelText,
    onNext,
    onPrevious,
    nextText,
    loading,
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
            loading={loading}
        />
    </FlexBox>
);

Footer.propTypes = {
    onNext: PropTypes.func.isRequired,
    nextText: PropTypes.string.isRequired,
    cancelText: PropTypes.string.isRequired,
    onPrevious: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

Footer.defaultProps = {
    loading: false,
};

export default Footer;
