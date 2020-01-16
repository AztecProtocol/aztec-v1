import React from 'react';
import {
  Hook, Console, Decode, Unhook,
} from 'console-feed';
import Web3 from 'web3';
import {
  Block, FlexBox, Button, Text, Icon, ButtonGroup,
} from '@aztec/guacamole-ui';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import Editor from 'react-styleguidist/lib/client/rsg-components/Editor';
import classnames from 'classnames';
import styles from './preview.module.scss';
import compileCode from '../utils/compileCode';
import getTestERC20 from '../utils/getTestERC20';
import evalInContext from '../utils/evalInContext';
import PERMITTED_LOGS from '../constants/logs';
import networkNames from '../constants/networks';


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


  handleChange = debounce((code) => {
    this.setState({ code });
  }, 100);

  static propTypes = {
    code: PropTypes.string.isRequired,
    compilerConfig: PropTypes.object.isRequired,
  };

  state = {
    ethBalance: 0,
    network: 0,
    accounts: [],
    linkedTokenBalance: 0,
    logs: [],
    code: '',
    initialCode: '',
    zkAssetAddress: '0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a',
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
    this.getWeb3Data();
  }


  componentWillUnmount() {
    // Clear pending changes
    this.handleChange.cancel();
    Unhook(window.console);
  }

  getWeb3Data = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);

      if (this.state.zkAssetAddress) {
        await window.aztec.enable();
        const { balanceOfLinkedToken, linkedTokenAddress } = await window.aztec.zkAsset(this.state.zkAssetAddress);
        const linkedTokenBalance = await balanceOfLinkedToken();
        this.setState({

          linkedTokenAddress,
          linkedTokenBalance,
        });
      }

      const ethBalance = await web3.eth.getBalance(window.ethereum.selectedAddress);

      this.setState({
        ethBalance: parseFloat(web3.utils.fromWei(ethBalance)).toFixed(2),
        network: window.ethereum.networkVersion,
        accounts: [ethereum.selectedAddress],
      });
    }
  }

  compileCode = async () => {
    const { code, network } = this.state;
    if (network !== '4') return;
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
    await this.getWeb3Data();
    this.setState({
      isRunning: false,
    });
  };

  getTestERC20 = async () => {
    this.setState({
      loadingTestTokens: true,
    });

    await getTestERC20('0x7Fd548E8df0ba86216BfD390EAEB5026adCb5B8a');
    this.setState({
      loadingTestTokens: false,
    });
  }

  render() {
    const {
      isRunning, logs, network, accounts = [],
    } = this.state;
    const isEnabled = network === '4';
    return (
      <Block background="white" borderRadius="xs" hasBorder>
        <Block padding="xs m" hasBorderBottom>
          <FlexBox align="space-between">
            <FlexBox aling="flex-start">
              <Text text="Ethereum Address: " size="s" />
              <Text text={` ${accounts[0]}`} size="s" weight="normal" color="grey" />
            </FlexBox>
            <Text text={networkNames[network]} size="s" weight="normal" color="orange" />
          </FlexBox>
        </Block>
        <Block background="grey-lightest">
          <FlexBox
            className={
              classnames({
                [styles.textArea]: true,
                [styles.codeRunning]: isRunning,
                [styles.rinkeby]: !isEnabled,
              })}
            stretch
            expand
          >
            <Editor code={this.state.code} onChange={this.handleChange} />
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
                <Button
                  text={`${this.state.ethBalance} ETH`}
                  size="m"
                  disabled
                  className={styles.testEth}
                />
                <Button
                  text="Faucet"
                  size="m"
                  onClick={this.getTestEth}
                  rounded={false}
                  disabled={!isEnabled}
                  className={styles.testEth}
                  icon={
                    <Icon name="local_gas_station" size="m" />
                  }
                />
                <Button
                  text={`${this.state.linkedTokenBalance} Linked ERC20`}
                  size="m"
                  disabled
                  className={styles.testEth}
                />
                <Button
                  text="Faucet"
                  size="m"
                  disabled={!isEnabled}
                  onClick={this.getTestERC20}
                  rounded={false}
                  isLoading={this.state.loadingTestTokens}
                  className={styles.testEth}
                />
              </ButtonGroup>
            </FlexBox>
            <Button
              text="Run Code"
              size="m"
              onClick={this.compileCode}
              isLoading={isRunning}
              rounded={false}
              className={styles.runCode}
              disabled={!isEnabled}
              icon={
                <Icon name="eject" size="m" rotate={90} />
              }
            />
          </FlexBox>
        </Block>
      </Block>
    );
  }
}

PreviewComponent.propTypes = {
  code: PropTypes.string,
  methodName: PropTypes.string,
};

PreviewComponent.defaultProps = {
  code: '',
};

export default PreviewComponent;
