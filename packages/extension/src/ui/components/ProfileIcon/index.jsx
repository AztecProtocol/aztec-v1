import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Avatar,
} from '@aztec/guacamole-ui';
import {
    avatarSizesMap,
} from '~ui/styles/guacamole-vars';

const themeStyleMapping = {
    light: {
        iconBackground: 'white-lighter',
        color: 'white',
    },
    white: {
        iconBackground: 'white',
        color: 'label',
    },
};

const ProfileIcon = ({
    className,
    theme,
    src,
    alt,
    size,
}) => {
    const style = themeStyleMapping[theme];
    return (
        <Block
            className={className}
            layer={1}
            borderRadius="circular"
            inline
        >
            <Avatar
                {...style}
                src={src}
                alt={alt}
                size={size}
                shape="circular"
            />
        </Block>
    );
};

ProfileIcon.propTypes = {
    className: PropTypes.string,
    theme: PropTypes.oneOf(['light', 'white']),
    src: PropTypes.string,
    alt: PropTypes.string,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
};

ProfileIcon.defaultProps = {
    className: '',
    theme: 'light',
    src: '',
    alt: '',
    size: 'm',
};

export default ProfileIcon;
