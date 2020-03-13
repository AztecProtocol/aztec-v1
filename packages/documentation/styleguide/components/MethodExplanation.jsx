import React from 'react';
import PropTypes from 'prop-types';
import { Block, Text } from '@aztec/guacamole-ui';

export default function MethodExplanation({ explanation }) {
  return (
    <Block background="white" borderRadius="xs" padding="xl 0">
      <Text text={explanation} size="m" weight="light" />
    </Block>
  );
}

MethodExplanation.propTypes = {
  explanation: PropTypes.string.isRequired,
};
