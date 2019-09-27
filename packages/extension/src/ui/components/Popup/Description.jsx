import React from 'react';
import PropTypes from 'prop-types';
import {
    Block,
    Text,
} from '@aztec/guacamole-ui';

const PopupDescription = ({
    className,
    text,
}) => (
    <Block
        className={className}
        padding="0 xl"
    >
        <Text
            text={text}
            size="xs"
            color="label"
        />
    </Block>
);

PopupDescription.propTypes = {
    className: PropTypes.string,
    text: PropTypes.string.isRequired,
};

PopupDescription.defaultProps = {
    className: '',
};

export default PopupDescription;
