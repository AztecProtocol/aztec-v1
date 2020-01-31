import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    SVG,
} from '@aztec/guacamole-ui';
import {
    colorMap,
    iconSizeMap,
} from '~/ui/styles/guacamole-vars';
import checkGlyph from '~/ui/images/tick.svg';

const BlockStatus = ({
    status,
    text,
}) => (
    <FlexBox
        valign="center"
        nowrap
    >
        <Block padding="0 xs">
            <Text
                text={text}
                size="xxs"
                color="primary"
            />
        </Block>
        {status === 'check' && (
            <SVG
                glyph={checkGlyph}
                fill={colorMap.primary}
                width={iconSizeMap.s}
                height={iconSizeMap.s}
            />
        )}
    </FlexBox>
);

BlockStatus.propTypes = {
    status: PropTypes.oneOf(['check']),
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]).isRequired,
};

BlockStatus.defaultProps = {
    status: 'check',
};

export default BlockStatus;
