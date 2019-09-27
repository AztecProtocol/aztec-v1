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
}) => (
    <Block padding="xs 0">
        <FlexBox
            valign="center"
            nowrap
        >
            <Text
                className="flex-fixed"
                text={`${title}:`}
                size="xs"
            />
            <Block
                className="flex-free-expand"
                left="s"
            >
                <Text
                    size="xs"
                    weight="light"
                    color="grey"
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
};

export default ListRow;
