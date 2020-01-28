import React from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';
import { useStyleGuideContext } from 'react-styleguidist/lib/client/rsg-components/Context';
import { Block, Text, Row } from '@aztec/guacamole-ui';

import ExamplesRenderer from './ExamplesRenderer';
import Playground from './Playground';
import LiveDocUpdate from './LiveDocUpdate';

export default function Examples({ examples, name, exampleMode }) {
  const { codeRevision } = useStyleGuideContext();

  let liveDocUpdate;
  if (name.includes('.')) {
    liveDocUpdate = <LiveDocUpdate name={name} />;
  }

  return (
    <Block>
      {liveDocUpdate}
      <ExamplesRenderer name={name}>
        {examples.map((example, index) => {
          switch (example.type) {
            case 'code':
              return (
                <Playground
                  code={example.content}
                  evalInContext={example.evalInContext}
                  key={`${codeRevision}/${index}`}
                  name={name}
                  index={index}
                  settings={example.settings}
                  exampleMode={exampleMode}
                />
              );
            case 'markdown':
              return <Markdown text={example.content} key={index} />;
            default:
              return null;
          }
        })}
      </ExamplesRenderer>
    </Block>
  );
}

Examples.propTypes = {
  examples: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  exampleMode: PropTypes.string.isRequired,
};
