import React from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';
import { useStyleGuideContext } from 'react-styleguidist/lib/client/rsg-components/Context';
import { Block } from '@aztec/guacamole-ui';
import ExamplesRenderer from './ExamplesRenderer';
import SdkPlayground from './SdkPlayground';
import LiveDocUpdate from './LiveDocUpdate';

const Examples = ({
  name,
  examples,
}) => {
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
                <SdkPlayground
                  key={`${codeRevision}/${+index}`}
                  code={example.content}
                />
              );
            case 'markdown':
              return (
                <Markdown
                  key={+index}
                  text={example.content}
                />
              );
            default:
              return null;
          }
        })}
      </ExamplesRenderer>
    </Block>
  );
};

Examples.propTypes = {
  name: PropTypes.string.isRequired,
  examples: PropTypes.array.isRequired,
};

export default Examples;
