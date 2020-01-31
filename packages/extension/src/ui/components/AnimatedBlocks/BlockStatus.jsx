import React from 'react';
import PropTypes from 'prop-types';
import {
    FlexBox,
    Block,
    Text,
    SVG,
    Loader,
} from '@aztec/guacamole-ui';
import {
    colorMap,
    iconSizeMap,
} from '~/ui/styles/guacamole-vars';
import checkGlyph from '~/ui/images/tick.svg';

const statusColorMap = {
    check: 'primary',
    loading: 'label',
};

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
                color={statusColorMap[status]}
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
        {status === 'loading' && (
            <Block padding="0 xxs">
                <Loader
                    theme="primary"
                    size="xxs"
                />
            </Block>
        )}
    </FlexBox>
);

BlockStatus.propTypes = {
    status: PropTypes.oneOf(['check', 'loading']),
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
    ]).isRequired,
};

BlockStatus.defaultProps = {
    status: 'check',
};

export default BlockStatus;
