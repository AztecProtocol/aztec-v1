import React from 'react';
import {
  Block,
  FlexBox,
  Button,
  Text,
  Row,
  TextInput,
} from '@aztec/guacamole-ui';
import PropTypes from 'prop-types';
import Editor from 'react-styleguidist/lib/client/rsg-components/Editor';
import styles from './preview.module.scss';

const PreviewComponent = ({
  code,
  methodName,
}) => (
  <Block
    background="white"
    borderRadius="xs"
    hasBorder
  >
    <Block
      padding="s"
      hasBorderBottom
    >
      <Text
        text={methodName}
        weight="bold"
        size="l"
      />

    </Block>
    <Block
      background="grey-lightest"
    >
      <FlexBox
        stretch
        expand
      >
        <Editor
          code={code}
          className={styles.textArea}
        />
      </FlexBox>
    </Block>
    <Block
      padding="s"
      background="primary"
      style={{
        borderRadius: '0 0 3px 3px',
      }}
    >
      <FlexBox
        align="flex-end"
        stretch
        expand
      >
        <Button text="Run Code" />
      </FlexBox>
    </Block>
  </Block>
);

PreviewComponent.propTypes = {
  code: PropTypes.string.isRequired,
  methodName: PropTypes.string.isRequired,
};

export default PreviewComponent;
