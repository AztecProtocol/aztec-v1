import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import assetsConfig from '~ui/config/assets';
import styles from './icon.scss';

const AssetIcon = ({
    className,
    code,
    alt,
    size,
}) => {
    const {
        iconSrc,
    } = assetsConfig[code] || {};
    if (!iconSrc) {
        return (
            <div
                className={classnames(
                    className,
                    styles['mock-icon'],
                    styles[`size-${size}`],
                )}
            >
                {code[0].toUpperCase()}
            </div>
        );
    }

    return (
        <img
            className={classnames(
                className,
                styles.icon,
                styles[`size-${size}`],
            )}
            src={iconSrc}
            alt={alt || code}
        />
    );
};

AssetIcon.propTypes = {
    className: PropTypes.string,
    code: PropTypes.string.isRequired,
    alt: PropTypes.string,
    size: PropTypes.oneOf(['m', 'l']),
};

AssetIcon.defaultProps = {
    className: '',
    alt: '',
    size: 'm',
};

export default AssetIcon;
