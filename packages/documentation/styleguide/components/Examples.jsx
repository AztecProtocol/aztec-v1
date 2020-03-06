import React from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';
import { Block } from '@aztec/guacamole-ui';
import SdkPlayground from './SdkPlayground';
import LiveDocUpdate from './LiveDocUpdate';

const Examples = ({
  name,
  examples,
}) => {
  let liveDocUpdate;
  if (name.includes('.')) {
    liveDocUpdate = <LiveDocUpdate name={name} />;
  }

  return (
    <div>
      {liveDocUpdate}
      <Block
        padding="l 0"
      >
        {examples.map((example, index) => {
          let contentNode;
          switch (example.type) {
            case 'code':
              contentNode = (
                <Block
                  key={`demo-${+index}`}
                  bottom="xxl"
                >
                  <SdkPlayground
                    code={example.content}
                  />
                </Block>
              );
              break;
            case 'markdown':
              contentNode = (
                <Markdown
                  key={`md-${+index}`}
                  text={example.content}
                />
              );
              break;
            default:
              return null;
          }

          return (
            <Block
              key={`${name}-${+index}`}
              testId={`${name}-${index}`}
              padding="l 0"
            >
              {contentNode}
            </Block>
          );
        })}
      </Block>
    </div>
  );
};

Examples.propTypes = {
  name: PropTypes.string.isRequired,
  examples: PropTypes.array.isRequired,
};

export default Examples;
