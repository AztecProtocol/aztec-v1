import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    Icon,
} from '@aztec/guacamole-ui';
import {
    colorNames,
} from '~/ui/styles/guacamole-vars';

const BlockStatus = ({
    text,
    iconName,
    iconColor,
}) => (
    <FlexBox
        valign="center"
        nowrap
    >
        <Block padding="0 xs">
            <Text
                text={text}
                size="xs"
                color="label"
            />
        </Block>
        <Icon
            name={iconName}
            color={iconColor}
            size="s"
        />
    </FlexBox>
);

BlockStatus.propTypes = {
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]).isRequired,
    iconName: PropTypes.string.isRequired,
    iconColor: PropTypes.oneOf(colorNames),
};

BlockStatus.defaultProps = {
    iconColor: 'primary',
};

export default BlockStatus;
