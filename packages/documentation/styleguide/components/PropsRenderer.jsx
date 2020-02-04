import React from 'react';
import PropTypes from 'prop-types';
import {
  Offset,
} from '@aztec/guacamole-ui';
import Group from 'react-group';
import Arguments from 'react-styleguidist/lib/client/rsg-components/Arguments';
import Argument from 'react-styleguidist/lib/client/rsg-components/Argument';
import Code from 'react-styleguidist/lib/client/rsg-components/Code';
import JsDoc from 'react-styleguidist/lib/client/rsg-components/JsDoc';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';
import Name from 'react-styleguidist/lib/client/rsg-components/Name';
import Type from 'react-styleguidist/lib/client/rsg-components/Type';
import Text from 'react-styleguidist/lib/client/rsg-components/Text';
import Para from 'react-styleguidist/lib/client/rsg-components/Para';
import Table from 'react-styleguidist/lib/client/rsg-components/Table';
import { unquote, getType, showSpaces } from '../utils/propsRenderer';

function renderType(type) {
  if (!type) {
    return 'unknown';
  }

  const { name } = type;

  switch (name) {
    case 'arrayOf':
      return `${type.value.name}[]`;
    case 'objectOf':
      return `{${renderType(type.value)}}`;
    case 'instanceOf':
      return type.value;
    default:
      return name;
  }
}

function renderComplexType(name, title) {
  return (
    <Text size="small" underlined title={title}>
      {name}
    </Text>
  );
}

function renderFlowType(type) {
  if (!type) {
    return 'unknown';
  }

  const { name, raw, value } = type;

  switch (name) {
    case 'enum':
      return name;
    case 'literal':
      return value;
    case 'signature':
      return renderComplexType(type.type, raw);
    case 'union':
    case 'tuple':
      return renderComplexType(name, raw);
    default:
      return raw || name;
  }
}

function renderEnum(prop) {
  if (!Array.isArray(getType(prop).value)) {
    return <span>{getType(prop).value}</span>;
  }

  const values = getType(prop).value.map(({ value }) => (
    <Code key={value}>
      {showSpaces(unquote(value))}
    </Code>
  ));

  return (
    <span>
      One of:
      <Group separator=", ">{values}</Group>
    </span>
  );
}

function renderShape(props) {
  return Object.keys(props).map((name) => {
    const prop = props[name];
    const { description } = prop;
    return (
      <div key={name}>
        <Name>{name}</Name>
        {': '}
        <Type>{renderType(prop)}</Type>
        {description && ' — '}
        {description && <Markdown text={description} inline />}
      </div>
    );
  });
}

function renderUnion(prop) {
  const type = getType(prop);
  if (!Array.isArray(type.value)) {
    return <span>{type.value}</span>;
  }

  const values = type.value.map((value, index) => (
    <Type key={`${value.name}-${+index}`}>
      {renderType(value)}
    </Type>
  ));

  return (
    <span>
      One of type:
      <Group separator=", ">{values}</Group>
    </span>
  );
}

function renderExtra(prop) {
  const type = getType(prop);
  if (!type) {
    return null;
  }
  switch (type.name) {
    case 'enum':
      return renderEnum(prop);
    case 'union':
      return renderUnion(prop);
    case 'shape':
      return renderShape(prop.type.value);
    case 'arrayOf':
      if (type.value.name === 'shape') {
        return renderShape(prop.type.value.value);
      }
      return null;
    case 'objectOf':
      if (type.value.name === 'shape') {
        return renderShape(prop.type.value.value);
      }
      return null;
    default:
      return null;
  }
}

function renderDescription(prop) {
  const { description, tags = {} } = prop;
  const extra = renderExtra(prop);
  const args = [...(tags.arg || []), ...(tags.argument || []), ...(tags.param || [])];
  const returnDocumentation = (tags.return && tags.return[0]) || (tags.returns && tags.returns[0]);

  return (
    <Offset margin="s">
      {description && <Markdown text={description} />}
      {extra && <Para>{extra}</Para>}
      <JsDoc {...tags} />
      {args.length > 0 && <Arguments args={args} heading />}
      {returnDocumentation && <Argument {...returnDocumentation} returns />}
    </Offset>
  );
}

function renderName(prop) {
  const { name, tags = {} } = prop;
  return <Name deprecated={!!tags.deprecated}>{name}</Name>;
}

function renderTypeColumn(prop) {
  if (prop.flowType) {
    return <Type>{renderFlowType(getType(prop))}</Type>;
  }
  return <Type>{renderType(getType(prop))}</Type>;
}

export function getRowKey(row) {
  return row.name;
}

export const columns = [
  {
    caption: 'Argument',
    render: renderName,
  },
  {
    caption: 'Type',
    render: renderTypeColumn,
  },
  {
    caption: 'Description',
    render: renderDescription,
  },
];

function PropsRenderer({ props }) {
  return (
    <Table
      columns={columns}
      rows={props}
      getRowKey={getRowKey}
    />
  );
}

PropsRenderer.propTypes = {
  props: PropTypes.array.isRequired,
};

export default PropsRenderer;
