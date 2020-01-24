import React from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';
import Name from 'react-styleguidist/lib/client/rsg-components/Name';
import JsDoc from 'react-styleguidist/lib/client/rsg-components/JsDoc';
import Table from 'react-styleguidist/lib/client/rsg-components/Table';
import Type from 'react-styleguidist/lib/client/rsg-components/Type';


const getRowKey = (row) => row.name;


export const columns = [
  {
    caption: 'Return variable',
    // eslint-disable-next-line react/prop-types
    render: ({ name, tags = {} }) => <Name deprecated={!!tags.deprecated}>{`${name}`}</Name>,
  },
  {
    caption: 'Type',
    render: ({ type, tags = {} }) => <Type>{type}</Type>,
  },
  {
    caption: 'Description',
    // eslint-disable-next-line react/prop-types
    render: ({ description, tags = {} }) => (
      <div>
        {description && <Markdown text={description} />}
        <JsDoc {...tags} />
      </div>
    ),
  },
];

export default function MethodReturnRenderer({ methods }) {
  return <Table columns={columns} rows={methods} getRowKey={getRowKey} />;
}

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
