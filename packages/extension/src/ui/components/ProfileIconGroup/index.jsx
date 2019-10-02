import React from 'react';
import PropTypes from 'prop-types';
import {
    AvatarGroup,
} from '@aztec/guacamole-ui';
import {
    themeType,
    profileType,
} from '~ui/config/propTypes';
import {
    avatarSizesMap,
} from '~ui/styles/guacamole-vars';
import {
    themeStyleMapping,
    typeIconMapping,
} from '~ui/components/ProfileIcon';
import Tooltip from './Tooltip';

const groupStyleMapping = {
    primary: {
        background: 'transparent',
    },
    white: {
        background: 'white',
    },
};

const ProfileIconGroup = ({
    className,
    theme,
    size,
    icons,
    moreItems,
}) => {
    const style = groupStyleMapping[theme];
    const {
        tooltipBackground,
        ...iconStyle
    } = themeStyleMapping[theme];

    const avatars = icons.map(({
        type,
        ...icon
    }) => {
        const {
            name: iconName,
        } = typeIconMapping[type] || {};

        return {
            ...iconStyle,
            ...icon,
            iconName,
        };
    });
    if (moreItems && moreItems.length) {
        const tooltipNode = (
            <Tooltip
                items={moreItems}
            />
        );
        avatars.push({
            ...iconStyle,
            alt: `+${moreItems.length}`,
            tooltip: tooltipNode,
        });
    }

    return (
        <AvatarGroup
            {...style}
            className={className}
            avatars={avatars}
            size={size}
            layer={1}
            tooltipBackground={tooltipBackground}
        />
    );
};

ProfileIconGroup.propTypes = {
    className: PropTypes.string,
    theme: themeType,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
    icons: PropTypes.arrayOf(PropTypes.shape({
        type: profileType,
        src: PropTypes.string,
        alt: PropTypes.string,
    })).isRequired,
    moreItems: PropTypes.arrayOf(PropTypes.string),
};

ProfileIconGroup.defaultProps = {
    className: '',
    theme: 'primary',
    size: 'm',
    moreItems: [],
};

export default ProfileIconGroup;
