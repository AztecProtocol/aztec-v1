import React from 'react';
import PropTypes from 'prop-types';
import {
  Block,
} from '@aztec/guacamole-ui';

export function ExamplesRenderer({ name, children }) {
  return (
    <Block
      data-testid={`${name}-examples`}
      padding="l 0"
    >
      {children}
    </Block>
  );
}

ExamplesRenderer.propTypes = {
  name: PropTypes.string.isRequired,
  children: PropTypes.node,
};

ExamplesRenderer.defaultProps = {
  children: null,
};

export default ExamplesRenderer;
