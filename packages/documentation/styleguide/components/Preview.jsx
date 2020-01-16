import React from 'react';
import { Hook, Console, Decode, Unhook } from 'console-feed';
import Web3 from 'web3';
import { Block, FlexBox, Button, Text, Icon, ButtonGroup } from '@aztec/guacamole-ui';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import Editor from 'react-styleguidist/lib/client/rsg-components/Editor';
import styles from './preview.module.scss';
import compileCode from '../utils/compileCode';
import evalInContext from '../utils/evalInContext';
import PERMITTED_LOGS from '../constants/logs';

class PreviewComponent extends React.Component {
  static getDerivedStateFromProps(nextProps, prevState) {
    const { initialCode } = prevState;
    let newCode;

    if (initialCode !== nextProps.code) {
      newCode = nextProps.code;
      return {
        ...prevState,
        initialCode: newCode,
        code: newCode,
        logs: [],
      };
    }

    return {
      ...prevState,
    };
  }

  state = {
    logs: [],
    code: '',
    initialCode: '',
  };

  handleChange = debounce((code) => {
    this.setState({ code });
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

  state = {
    ethBalance: 0,
    accounts: [],
  };

  componentDidMount() {
    Hook(window.console, (log) => {
      const decodedLog = Decode(log);

      if (PERMITTED_LOGS.indexOf(decodedLog.method) > -1) {
        this.setState({
          logs: [...this.state.logs, decodedLog],
        });
      }
    });
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        this.setState({ accounts });
      });
      window.ethereum.on('networkChanged', (network) => {
        this.setState({ network });
      });
      const web3 = new Web3(window.ethereum);
      const ethBalance = web3.eth.getBalance(ethereum.selectedAddress).then((ethBalance) => {
        this.setState({ ethBalance: parseFloat(web3.utils.fromWei(ethBalance)).toFixed(2) });
      });
    }
  }

  componentWillUnmount() {
    // Clear pending changes
    this.handleChange.cancel();
    Unhook(window.console);
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
      logs: [],
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
        {methodName && (
          <Block padding="s" hasBorderBottom>
            <Text text={methodName} size="m" />
          </Block>
        )}
        <Block background="grey-lightest">
          <FlexBox className={isRunning ? `${styles.textArea} ${styles.codeRunning}` : styles.textArea} stretch expand>
            <Editor code={this.props.code} onChange={this.handleChange} />
          </FlexBox>
        </Block>
        {!!logs.length && (
          <Block
            padding="m s"
            background="grey-darker"
            style={{
              borderRadius: logs.length ? '0 0 0px 0px' : '0 0 3px 3px',
            }}
            className={styles.logs}
          >
            <Console
              logs={logs}
              filter={PERMITTED_LOGS}
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
        <Block
          background="black"
          style={{
            borderRadius: '0 0 3px 3px',
          }}
        >
          <FlexBox align="space-between" stretch expand>
            <FlexBox align="flex-start">
              <ButtonGroup className={styles.group}>
                <Button text={`${this.state.ethBalance} ETH`} size="m" disabled className={styles.testEth} />
                <Button
                  text="Faucet"
                  size="m"
                  onClick={this.getTestEth}
                  rounded={false}
                  className={styles.testEth}
                  icon={<Icon name="local_gas_station" size="m" />}
                />
                <Button text="0 Test Dai" size="m" disabled className={styles.testEth} />
                <Button text="Faucet" size="m" onClick={this.getTestEth} rounded={false} className={styles.testEth} />
              </ButtonGroup>
            </FlexBox>
            <Button
              text="Run Code"
              size="m"
              onClick={this.compileCode}
              isLoading={isRunning}
              rounded={false}
              className={styles.runCode}
              icon={<Icon name="eject" size="m" rotate="90" />}
            />
          </FlexBox>
        </Block>
      </Block>
    );
  }
}

PreviewComponent.propTypes = {
  code: PropTypes.string,
  methodName: PropTypes.string.isRequired,
};

PreviewComponent.defaultProps = {
  code: '',
};

export default PreviewComponent;
