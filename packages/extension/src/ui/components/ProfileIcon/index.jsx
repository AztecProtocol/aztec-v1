import React from 'react';
import PropTypes from 'prop-types';
import {
    Avatar,
} from '@aztec/guacamole-ui';
import {
    avatarSizesMap,
} from '~ui/styles/guacamole-vars';

export const themeStyleMapping = {
    primary: {
        background: 'transparent',
        iconBackground: 'white-lighter',
        color: 'white',
        tooltipBackground: 'white-light',
    },
    white: {
        background: 'white',
        iconBackground: 'grey-lighter',
        color: 'grey',
        tooltipBackground: 'grey-dark',
    },
};

export const typeIconMapping = {
    asset: {
        name: 'blur_on',
    },
    user: {
        name: 'person',
    },
};

const ProfileIcon = ({
    className,
    theme,
    type,
    src,
    alt,
    size,
}) => {
    const style = themeStyleMapping[theme];
    const {
        name: iconName,
    } = typeIconMapping[type] || {};

    return (
        <Avatar
            className={className}
            src={src}
            alt={alt}
            iconName={iconName}
            size={size}
            shape="circular"
            layer={1}
            {...style}
        />
    );
};

ProfileIcon.propTypes = {
    className: PropTypes.string,
    theme: PropTypes.oneOf(Object.keys(themeStyleMapping)),
    type: PropTypes.oneOf(['', 'asset', 'user']),
    src: PropTypes.string,
    alt: PropTypes.string,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
};

ProfileIcon.defaultProps = {
    className: '',
    theme: 'primary',
    type: '',
    src: '',
    alt: '',
    size: 'm',
};

export default ProfileIcon;
