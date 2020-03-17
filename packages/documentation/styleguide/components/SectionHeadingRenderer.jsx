import React from 'react';
import PropTypes from 'prop-types';
import { Block, Text } from '@aztec/guacamole-ui';
import { fontSizeKeys } from '../../src/styles/guacamole-vars';

const levelSpacingMapping = {
    1: 'xl',
};

export const SectionHeadingRenderer = ({ id, depth, children }) => {
    const level = Math.min(7, depth);
    const fontSizeKey = fontSizeKeys[fontSizeKeys.length - level];
    return (
        <Block id={id} padding={`${levelSpacingMapping[level] || 'l'} 0`}>
            <Text size={fontSizeKey}>{children}</Text>
        </Block>
    );
};

SectionHeadingRenderer.propTypes = {
    children: PropTypes.node,
    id: PropTypes.string.isRequired,
    depth: PropTypes.number.isRequired,
};

SectionHeadingRenderer.defaultProps = {
    children: null,
};

export default SectionHeadingRenderer;
