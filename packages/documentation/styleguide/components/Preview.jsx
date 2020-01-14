import React from 'react';
import { Hook, Console, Decode } from 'console-feed';
import { Block, FlexBox, Button, Text } from '@aztec/guacamole-ui';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import Editor from 'react-styleguidist/lib/client/rsg-components/Editor';
import styles from './preview.module.scss';

import compileCode from '../utils/compileCode';
import evalInContext from '../utils/evalInContext';

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

  compileCode = async () => {
    const { code } = this.state;
    const { compilerConfig } = this.props;
    const compiledCode = compileCode(code, compilerConfig, console.log);
    const asyncCompiledCode = `const code = async () => {
      try {
        ${compiledCode};
      } catch(err) {
        console.error(err);
      }
      }

      return code()`;
    this.setState({
      isRunning: true,
    });

    await evalInContext(asyncCompiledCode);
    this.setState({
      isRunning: false,
    });
  };

  render() {
    const { methodName } = this.props;
    const { isRunning, logs } = this.state;
    return (
      <Block background="white" borderRadius="xs" hasBorder>
        <Block padding="s" hasBorderBottom>
          <Text text={methodName} size="m" />
        </Block>
        <Block background="grey-lightest">
          <FlexBox className={isRunning ? `${styles.textArea} ${styles.codeRunning}` : styles.textArea} stretch expand>
            <Editor code={this.state.code} onChange={this.handleChange} />
          </FlexBox>
        </Block>
        <Block
          padding="s"
          background="primary"
          style={{
            borderRadius: logs.length ? '0 0 0px 0px' : '0 0 3px 3px',
          }}
        >
          <FlexBox align="flex-end" stretch expand>
            <Button text="Run" onClick={this.compileCode} isLoading={isRunning} />
          </FlexBox>
        </Block>
        {!!logs.length && (
          <Block
            padding="s"
            background="primary"
            style={{
              borderRadius: '0 0 3px 3px',
            }}
          >
            <Console
              logs={logs}
              filter={['info', 'error']}
              variant="dark"
              styles={{
                LOG_BACKGROUND: 'transparent',
                LOG_INFO_BACKGROUND: 'transparent',
                LOG_RESULT_BACKGROUND: 'transparent',
                LOG_WARN_BACKGROUND: 'transparent',
                LOG_ERROR_BACKGROUND: 'transparent',
                BASE_BACKGROUND_COLOR: 'transparent',
                TABLE_TH_BACKGROUND_COLOR: 'transparent',
                LOG_INFO_BORDER: 'none',
                LOG_RESULT_BORDER: 'none',
                LOG_ERROR_BORDER: 'none',
                LOG_BORDER: 'none',
              }}
            />
          </Block>
        )}
      </Block>
    );
  }
}

PreviewComponent.propTypes = {
  code: PropTypes.string.isRequired,
  methodName: PropTypes.string.isRequired,
};

export default PreviewComponent;
