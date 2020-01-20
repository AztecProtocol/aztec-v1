import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
} from '@aztec/guacamole-ui';
import {
    avatarSizesMap,
    fontSizeKeys,
    textColorNames,
} from '~/ui/styles/guacamole-vars';
import {
    themeType,
    profileShape,
} from '~/ui/config/propTypes';
import ProfileIcon from '~/ui/components/ProfileIcon';

const spacingMapping = {
    xxs: 's',
    xs: 's',
    s: 'm',
    m: 'm',
    l: 'l',
    xl: 'l',
    xxl: 'l',
};

const ListItem = ({
    className,
    theme,
    size,
    textSize,
    profile,
    content,
    footnote,
    color,
}) => {
    const contentNode = (
        <Text
            size={textSize || size}
            color={color}
        >
            {content}
        </Text>
    );

    const profileNode = !profile
        ? contentNode
        : (
            <FlexBox
                className={footnote ? '' : className}
                valign="center"
                nowrap
            >
                <ProfileIcon
                    {...profile}
                    src={profile.icon}
                    className="flex-fixed"
                    theme={theme}
                    size={size}
                />
                <Block
                    className="flex-free-expand"
                    align="left"
                    left={spacingMapping[size]}
                >
                    {contentNode}
                </Block>
            </FlexBox>
        );

    if (!footnote) {
        return profileNode;
    }

    return (
        <FlexBox
            className={className}
            align="space-between"
            valign="center"
            expand
            nowrap
        >
            {profileNode}
            <Block left="m">
                <Text
                    size={textSize || size}
                >
                    {footnote}
                </Text>
            </Block>
        </FlexBox>
    );
};

ListItem.propTypes = {
    className: PropTypes.string,
    theme: themeType,
    size: PropTypes.oneOf(Object.keys(avatarSizesMap)),
    textSize: PropTypes.oneOf(['', 'inherit', ...fontSizeKeys]),
    profile: profileShape,
    content: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element,
    ]).isRequired,
    footnote: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element,
    ]),
    color: PropTypes.oneOf(['', ...textColorNames]),
};

ListItem.defaultProps = {
    className: '',
    theme: 'white',
    size: 's',
    textSize: '',
    profile: null,
    footnote: null,
    color: '',
};

export default ListItem;
