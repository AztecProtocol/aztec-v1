import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    FlexBox,
    Text,
} from '@aztec/guacamole-ui';

const ListRow = ({
    title,
    content,
    size,
    contentSize,
    color,
}) => (
    <Block padding="xs 0">
        <FlexBox
            valign="center"
            nowrap
        >
            <Text
                className="flex-fixed"
                text={`${title}:`}
                size={size}
            />
            <Block
                className="flex-free-expand"
                left="s"
            >
                <Text
                    size={contentSize || size}
                    color={color}
                >
                    {content}
                </Text>
            </Block>
        </FlexBox>
    </Block>
);

ListRow.propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element,
    ]).isRequired,
    size: PropTypes.string,
    contentSize: PropTypes.string,
    color: PropTypes.string,
};

ListRow.defaultProps = {
    size: 'xs',
    contentSize: '',
    color: 'default',
};

export default ListRow;
