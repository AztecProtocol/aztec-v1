import React from 'react';
import PropTypes from 'prop-types';
import Name from 'react-styleguidist/lib/client/rsg-components/Name';
import Table from 'react-styleguidist/lib/client/rsg-components/Table';
import Type from 'react-styleguidist/lib/client/rsg-components/Type';
import PropsDescription from './PropsDescription';

const getRowKey = row => row.name;

export const columns = [
  {
    caption: 'Return variable',
    // eslint-disable-next-line react/prop-types
    render: ({ name, tags = {} }) => <Name deprecated={!!tags.deprecated}>{`${name}`}</Name>,
  },
  {
    caption: 'Type',
    // eslint-disable-next-line react/prop-types
    render: ({ type }) => <Type>{type}</Type>,
  },
  {
    caption: 'Description',
    // eslint-disable-next-line react/prop-types
    render: ({ description }) => (
      <PropsDescription
        description={description}
      />
    ),
  },
];

const MethodReturnRenderer = ({ methods }) => (
  <Table
    columns={columns}
    rows={methods}
    getRowKey={getRowKey}
  />
);

MethodReturnRenderer.propTypes = {
  methods: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      returns: PropTypes.object,
      params: PropTypes.array,
      tags: PropTypes.object,
    }),
  ).isRequired,
};

export default MethodReturnRenderer;
