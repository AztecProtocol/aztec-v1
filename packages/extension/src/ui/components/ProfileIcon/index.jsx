import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
    Avatar,
    Block,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import {
    themeType,
    profileType,
} from '~/ui/config/propTypes';
import {
    avatarSizesMap,
} from '~/ui/styles/guacamole-vars';
import ProfileSvg from '~/ui/components/ProfileSvg';
import AztecSvg from '~/ui/components/AztecSvg';
import metamaskGlyph from '~/ui/images/metamask.svg';
import userGlyph from '~/ui/images/user.svg';
import colorSchemes from './config/colorSchemes';
import shapeGenerators from './config/shapeGenerators';
import styles from './icon.scss';

export const themeStyleMapping = {
    primary: {
        background: 'transparent',
        iconBackground: 'white-lighter',
        color: 'white',
    },
    white: {
        background: 'white',
        iconBackground: 'grey-lighter',
        color: 'grey',
    },
};

const defaultIconMapping = {
    asset: 'blur_on',
    token: 'blur_on',
    user: 'person',
};

const ProfileIcon = ({
    className,
    theme,
    type,
    address,
    linkedTokenAddress,
    noteHash,
    src,
    icon,
    alt,
    tooltip,
    size,
}) => {
    const wrapperClassName = classnames(
        className,
        styles[`theme-${theme}`],
        styles[`size-${size}`],
    );

    let iconNode;
    if (type === 'aztec') {
        iconNode = (
            <AztecSvg
                className={!tooltip ? className : ''}
                theme={theme}
                size={size}
            />
        );
    } else if (type === 'metamask') {
        iconNode = (
            <SVG
                glyph={metamaskGlyph}
                width={avatarSizesMap[size]}
                height={avatarSizesMap[size]}
            />
        );
    } else if (!type || src || icon) {
        const style = themeStyleMapping[theme];

        iconNode = (
            <Avatar
                className={classnames(
                    {
                        [wrapperClassName]: !tooltip,
                        [styles['with-icon']]: !(src || icon),
                        [styles['type-asset']]: type === 'asset',
                    },
                )}
                src={src || icon}
                alt={alt}
                size={size}
                shape="circular"
                layer={1}
                iconName={defaultIconMapping[type]}
                {...style}
            />
        );
    } else {
        iconNode = (
            <ProfileSvg
                className={classnames(
                    styles[`type-${type}`],
                    {
                        [wrapperClassName]: !tooltip,
                    },
                )}
                address={linkedTokenAddress || address || noteHash}
                size={size}
                alt={alt}
                colorScheme={colorSchemes[type]}
                shapeGenerator={shapeGenerators[type]}
            >
                {type === 'note' && (
                    <AztecSvg
                        className={styles['aztec-icon']}
                        theme="light"
                        size={size}
                    />
                )}
                {type === 'user' && (
                    <SVG
                        className={styles['user-icon']}
                        glyph={userGlyph}
                        width={avatarSizesMap[size]}
                        height={avatarSizesMap[size]}
                        fill="rgba(0,0,0,0.6)"
                    />
                )}
            </ProfileSvg>
        );
    }

    if (!tooltip) {
        return iconNode;
    }

    return (
        <div
            className={classnames(
                wrapperClassName,
                styles.interactive,
            )}
        >
            {iconNode}
            <Block
                className={styles.tooltip}
            >
                {typeof tooltip !== 'string'
                    ? tooltip
                    : (
                        <Text
                            text={tooltip}
                            size="xxs"
                        />
                    )}
            </Block>
        </div>
    );
};

ProfileIcon.propTypes = {
    className: PropTypes.string,
    theme: themeType,
    type: profileType,
    address: PropTypes.string,
    linkedTokenAddress: PropTypes.string,
    noteHash: PropTypes.string,
    src: PropTypes.string,
    icon: PropTypes.string,
    alt: PropTypes.string,
    tooltip: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
};

ProfileIcon.defaultProps = {
    className: '',
    theme: 'primary',
    address: '',
    linkedTokenAddress: '',
    noteHash: '',
    type: '',
    src: '',
    icon: '',
    alt: '',
    tooltip: '',
    size: 'm',
};

export default ProfileIcon;
