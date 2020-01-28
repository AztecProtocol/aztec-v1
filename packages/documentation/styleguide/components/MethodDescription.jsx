import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Text } from '@aztec/guacamole-ui';

export default function MethodDescription({ description }) {
  return <Text text={description} size="m" />;
}

MethodDescription.propTypes = {
  description: PropTypes.string.isRequired,
};
