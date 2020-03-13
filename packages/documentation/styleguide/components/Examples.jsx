import React from 'react';
import PropTypes from 'prop-types';
import Markdown from 'react-styleguidist/lib/client/rsg-components/Markdown';
import { Block } from '@aztec/guacamole-ui';
import SdkPlayground from './SdkPlayground';
import LiveDocUpdate from './LiveDocUpdate';
import styles from './examples.module.scss';

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
                  top="xl"
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
                <div
                  key={`md-${+index}`}
                  className={styles.markdown}
                >
                  <Markdown
                    text={example.content}
                  />
                </div>
              );
              break;
            default:
              return null;
          }

          return contentNode;
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
