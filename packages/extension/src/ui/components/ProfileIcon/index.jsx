import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Avatar,
    Icon,
    Text,
} from '@aztec/guacamole-ui';
import {
    themeType,
    profileType,
} from '~ui/config/propTypes';
import {
    avatarSizesMap,
} from '~ui/styles/guacamole-vars';
import styles from './icon.scss';

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
    token: {
        name: 'blur_on',
    },
    asset: {
        name: 'blur_on',
    },
    user: {
        name: 'person',
    },
};

export const inlineIconMapping = {
    token: {
        name: 'blur_circular',
    },
    asset: {
        name: 'blur_circular',
    },
    user: {
        name: 'person_outline',
    },
};

const ProfileIcon = ({
    className,
    theme,
    type,
    src,
    alt,
    size,
    inline,
}) => {
    const style = themeStyleMapping[theme];
    const {
        name: iconName,
    } = (inline && inlineIconMapping[type])
        || typeIconMapping[type]
        || {};

    if (inline && !src) {
        const {
            color,
        } = style;

        if (alt) {
            return (
                <Text
                    text={alt}
                    size={size}
                    color={color}
                />
            );
        }
        return (
            <Icon
                name={iconName}
                size={size}
                color={color}
            />
        );
    }

    return (
        <Avatar
            className={classnames(
                className,
                styles[`theme-${theme}`],
                styles[`size-${size}`],
                {
                    [styles['wrapped-asset-icon']]: type === 'asset',
                    [styles['with-icon']]: !src,
                },
            )}
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
    theme: themeType,
    type: profileType,
    src: PropTypes.string,
    alt: PropTypes.string,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
    inline: PropTypes.bool,
};

ProfileIcon.defaultProps = {
    className: '',
    theme: 'primary',
    type: '',
    src: '',
    alt: '',
    size: 'm',
    inline: false,
};

export default ProfileIcon;
