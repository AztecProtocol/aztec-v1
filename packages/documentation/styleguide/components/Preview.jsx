import React from 'react';
import { Hook, Console, Decode, Unhook } from 'console-feed';
import Web3 from 'web3';
import { Block, FlexBox, Button, Text, Icon, ButtonGroup } from '@aztec/guacamole-ui';
import debounce from 'lodash/debounce';
import PropTypes from 'prop-types';
import Editor from 'react-styleguidist/lib/client/rsg-components/Editor';
import classnames from 'classnames';
import { keccak256, toChecksumAddress } from 'web3-utils';

import styles from './preview.module.scss';
import { AZTEC_API_KEY } from '../constants/keys';
import compileCode from '../utils/compileCode';
import getTestERC20 from '../utils/getTestERC20';
import getTestEth from '../utils/getTestEth';
import getContractAddress from '../utils/getContractAddress';
import PERMITTED_LOGS from '../constants/logs';
import networkNames from '../constants/networks';

class Preview extends React.Component {
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
    iframeId: 0,
    ethBalance: 0,
    network: 0,
    accounts: [],
    linkedTokenBalance: 0,
    logs: [],
    code: '',
    initialCode: '',
    zkAssetAddress: getContractAddress('ZkAsset'),
    userAddress: '',
    isWeb3Loaded: false,
  };

  // eslint-disable-next-line react/sort-comp
  generateIframeContent = () => {
    const { code } = this.state;
    const { compilerConfig } = this.props;

    // iframeId is the first 5 bytes code hash
    const iframeId = keccak256(code).slice(5);
    this.setState({ iframeId });

    // all calls to window.aztec need to go to the parent window,
    // as SDK not loaded in this iframe
    const compiledCode = compileCode(code, compilerConfig, console.log)
      .replace(/window.aztec/g, 'window.parent.aztec')
      .replace(/window.ethereum/g, 'window.parent.ethereum');

    const asyncCompiledCode = `const code = async () => {
      try {
        ${compiledCode};
      } catch(err) {
        console.error(err);
      }
      window.parent.postMessage('EXAMPLE_RAN');
    }
  ;
    code();`;
    const iframeDoc = `
        <html>
            <head>
            <script>
            ${asyncCompiledCode};
            </script>
            </head>
          <body>
          </body>
        </html>`;
    return iframeDoc;
  };

  componentDidMount() {
    this.setUpWeb3();
  }

  setUpWeb3 = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.enable();
        await this.getWeb3Data();
        if (!window.aztec.enabled) {
          try {
            await window.aztec.enable({
              apiKey: AZTEC_API_KEY,
            });
          } catch (e) {
            console.log(e);
          }
        }

        if (!this.txSubscription) {
          window.ethereum.on('accountsChanged', () => {
            this.getWeb3Data();
          });
          window.ethereum.on('chainChanged', () => {
            this.getWeb3Data();
          });
          window.ethereum.on('networkChanged', () => {
            this.getWeb3Data();
          });
          const web3 = new Web3(window.ethereum);

          this.txSubscription = web3.eth.subscribe('newBlockHeaders').on('data', (transaction) => {
            this.getWeb3Data();
          });
        }
      } catch (err) {
        console.log(err);
      }

      const { code, accounts, zkAssetAddress } = this.state;
      const userAddress = accounts[0];
      const updatedCode = code
        .replace(/zkAssetAddress = ''/g, `zkAssetAddress = '${toChecksumAddress(zkAssetAddress)}'`)
        .replace(/userAddress = ''/g, `userAddress = '${toChecksumAddress(userAddress)}'`)
        .replace(/thirdPartyAddress = ''/g, `thirdPartyAddress = '${toChecksumAddress(userAddress)}'`);

      this.setState({ code: updatedCode, isWeb3Loaded: true });
    }
  };

  componentWillUnmount() {
    // Clear pending changes
    this.handleChange.cancel();
    this.txSubscription.unsubscribe();
    Unhook(window.console);
  }

  getWeb3Data = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      if (window.aztec.enabled) {
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
        accounts: [window.ethereum.selectedAddress],
      });
    }
  };

  setupLogingInIframe = async () => {
    Unhook(this.iframeRef.contentWindow.console);
    Hook(this.iframeRef.contentWindow.console, (log) => {
      const decodedLog = Decode(log);
      if (PERMITTED_LOGS.indexOf(decodedLog.method) > -1) {
        this.setState({
          logs: [...this.state.logs, decodedLog],
        });
        this.scrollLogs();
      }
    });
  };

  scrollLogs = () => {
    if (this.consoleRef) {
      this.consoleRef.scrollTop = this.consoleRef.scrollHeight;
    }
  };

  compileCodeInIframe = async () => {
    Unhook(this.iframeRef.contentWindow.console);
    this.iframeRef.srcdoc = this.generateIframeContent();
    const iframeLoaded = new Promise((resolve) => {
      this.iframeRef.onload = resolve;
    });
    await iframeLoaded;
    Hook(this.iframeRef.contentWindow.console, (log) => {
      const decodedLog = Decode(log);
      if (PERMITTED_LOGS.indexOf(decodedLog.method) > -1) {
        this.setState({
          logs: [...this.state.logs, decodedLog],
        });
        this.scrollLogs();
      }
    });

    return new Promise((resolve) => {
      window.addEventListener('message', (event) => {
        if (event.data === 'EXAMPLE_RAN') {
          resolve(event);
        }
      });
    });
  };

  getTestERC20 = async () => {
    this.setState({
      loadingTestTokens: true,
    });
    this.setupLogingInIframe();
    await getTestERC20(this.state.zkAssetAddress, this.iframeRef.contentWindow.console);
    await this.getWeb3Data();
    this.setState({
      loadingTestTokens: false,
    });
  };

  getTestEth = async () => {
    this.setState({
      loadingTestEth: true,
    });

    this.setupLogingInIframe();
    await getTestEth(this.iframeRef.contentWindow.console);
    await this.getWeb3Data();
    this.setState({
      loadingTestEth: false,
    });
  };

  runCode = async () => {
    this.setState({
      isRunning: true,
      logs: [],
    });
    await this.getWeb3Data();
    await this.compileCodeInIframe();
    this.setState({
      isRunning: false,
    });
  };

  setConsoleRef = (ref) => {
    this.consoleRef = ref;
  };

  render() {
    const { isRunning, isWeb3Loaded, logs, network, accounts = [] } = this.state;
    const isEnabled = network === '4';

    return (
      <>
        <iframe
          ref={(ref) => {
            this.iframeRef = ref;
          }}
          id={this.state.iframeId}
          height="0"
          width="0"
        />
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
              className={classnames({
                [styles.textArea]: true,
                [styles.codeRunning]: isRunning,
                [styles.rinkeby]: !isEnabled,
                [styles.web3Data]: !isWeb3Loaded,
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
              <div ref={this.setConsoleRef}>
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
              </div>
            </Block>
          )}
          <Block
            background="grey-darker"
            style={{
              borderRadius: '0 0 3px 3px',
            }}
            hasBorderTop
            borderColor="white-lighter"
          >
            <FlexBox align="space-between" stretch expand>
              <FlexBox align="flex-start">
                <ButtonGroup className={styles.group}>
                  <Button text={`${this.state.ethBalance} ETH`} size="m" disabled className={styles.testEth} />
                  <Button
                    text="Get ETH"
                    size="m"
                    onClick={(isEnabled || this.state.ethBalance < 0.1) && this.getTestEth}
                    rounded={false}
                    disabled={!isEnabled || this.state.ethBalance > 0.1}
                    isLoading={this.state.loadingTestEth}
                    className={styles.testEth}
                    icon={<Icon name="local_gas_station" size="m" />}
                  />
                  <Button text={`${this.state.linkedTokenBalance} ERC20`} size="m" disabled className={styles.testEth} />
                  <Button
                    text="Get"
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
                onClick={this.runCode}
                isLoading={isRunning}
                rounded={false}
                className={styles.runCode}
                disabled={!isEnabled}
                icon={<Icon name="eject" size="m" rotate={90} />}
              />
            </FlexBox>
          </Block>
        </Block>
      </>
    );
  }
}
Preview.propTypes = {
  code: PropTypes.string,
  methodName: PropTypes.string,
};
Preview.defaultProps = {
  code: '',
};
export default Preview;
