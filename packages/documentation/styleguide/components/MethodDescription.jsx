import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Block, Text } from '@aztec/guacamole-ui';

export default function MethodDescription({ description }) {
  return (
    <Block background="white" borderRadius="xs" padding="xl">
      <Text text={description} size="m" />
    </Block>
  );
}

MethodDescription.propTypes = {
  // description: PropTypes.string.isRequired,
};
