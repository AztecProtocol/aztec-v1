import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './logo.scss';

const Logo = ({
    className,
    size,
    spin,
}) => (
    <div
        className={classnames(
            className,
            styles.iconWapper,
            styles[`size-${size}`],
            {
                [styles.rotating]: spin,
            },
        )}
    >
        <div className={styles.baseHolder}>
            <div className={styles.base} />
        </div>
        <div className={styles.coreHolder}>
            <div className={styles.core} />
        </div>
    </div>
);

Logo.propTypes = {
    className: PropTypes.string,
    size: PropTypes.oneOf(['m']),
    spin: PropTypes.bool,
};

Logo.defaultProps = {
    className: '',
    size: 'm',
    spin: false,
};

export default Logo;
