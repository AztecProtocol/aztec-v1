import React from 'react';
import PropTypes from 'prop-types';
import { Block } from '@aztec/guacamole-ui';
import HeadingRenderer from './HeadingRenderer';

function MarkdownHeading({ level, children }) {
    return (
        <Block top="s">
            <HeadingRenderer level={level}>{children}</HeadingRenderer>
        </Block>
    );
}

MarkdownHeading.propTypes = {
    level: PropTypes.oneOf([1, 2, 3, 4, 5, 6]).isRequired,
    children: PropTypes.node,
};

MarkdownHeading.defaultProps = {
    children: null,
};

export default MarkdownHeading;
