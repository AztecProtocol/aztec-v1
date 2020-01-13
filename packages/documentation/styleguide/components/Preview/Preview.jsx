import React from 'react';
import { Hook, Console, Decode } from 'console-feed';
import { Block, FlexBox, Button, Text } from '@aztec/guacamole-ui';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import Editor from 'react-styleguidist/lib/client/rsg-components/Editor';
import styles from './preview.module.scss';

import compileCode from '../../utils/compileCode';
import evalInContext from '../../utils/evalInContext';

class PreviewComponent extends React.Component {
  handleChange = debounce((code) => {
    this.state = {
      code,
    };
  }, 100);

  static propTypes = {
    code: PropTypes.string.isRequired,
    compilerConfig: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const { code } = this.props;
    this.state = { code, logs: [] };
  }

  componentDidMount() {
    Hook(window.console, (log) => {
      this.setState(({ logs }) => ({ logs: [...logs, Decode(log)] }));
    });
  }

  componentWillUnmount() {
    // Clear pending changes
    this.handleChange.cancel();
  }

  compileCode = () => {
    const { code } = this.state;
    const { compilerConfig } = this.props;
    const compiledCode = compileCode(code, compilerConfig, console.log);
    const asyncCompiledCode = `(async () => {
      try {
        ${compiledCode};
      } catch(err) {
        console.error(err);
      }
      })()`;

    evalInContext(asyncCompiledCode);
  };

  render() {
    const { methodName } = this.props;
    return (
      <Block background="white" borderRadius="xs" hasBorder>
        <Block padding="s" hasBorderBottom>
          <Text text={methodName} weight="bold" size="l" />
        </Block>
        <Block background="grey-lightest">
          <FlexBox stretch expand>
            <Editor code={this.state.code} className={styles.textArea} onChange={this.handleChange} />
          </FlexBox>
        </Block>
        <Block
          padding="s"
          background="primary"
          style={{
            borderRadius: '0 0 3px 3px',
          }}
        >
          <FlexBox align="flex-end" stretch expand>
            <Button text="Run Code" onClick={this.compileCode} />
          </FlexBox>
        </Block>
        <Console logs={this.state.logs} filter={['info', 'error']} variant="dark" />
      </Block>
    );
  }
}

PreviewComponent.propTypes = {
  code: PropTypes.string.isRequired,
  methodName: PropTypes.string.isRequired,
};

export default PreviewComponent;
