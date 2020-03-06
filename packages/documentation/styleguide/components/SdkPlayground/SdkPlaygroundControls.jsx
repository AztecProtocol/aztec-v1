import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  fromWei,
} from 'web3-utils';
import {
  FlexBox,
  Block,
  Text,
  Loader,
  Icon,
  Button,
} from '@aztec/guacamole-ui';
import {
  AZTEC_API_KEY,
  REQUIRED_NETWORK,
} from '../../config/aztec';
import getTestEth from '../../utils/getTestEth';
import getTestERC20 from './utils/getTestERC20';
import styles from './sdk-playground.module.scss';

class SdkPlaygroundControls extends PureComponent {
  constructor(props) {
    super(props);

    this.isAztecAvailable = typeof window.ethereum !== 'undefined';

    this.state = {
      sdkLoaded: false,
      loggingIn: false,
      autoLogin: false,
      aztecAccount: null,
      prevAccount: null,
      account: null,
      network: null,
      asset: null,
      error: null,
      ethBalance: 0,
      linkedTokenBalance: 0,
      refreshingBalances: false,
      loadingTestEth: false,
      loadingTestERC20: false,
    };
  }

  componentDidMount() {
    this.ensureAztecLoaded();
  }

  componentWillUnmount() {
    window.aztec.removeListener('profileChanged', this.handleProfileChanged);
  }

  handleProfileChanged = (type, value, error) => {
    const {
      loggingIn: wasLoggingIn,
    } = this.state;
    const nextState = {
      aztecAccount: null,
      loggingIn: !value && wasLoggingIn,
      asset: null,
    };
    let nextAction = null;

    switch (type) {
      case 'accountChanged': {
        nextState.account = value;

        const {
          account: prevAccount,
          autoLogin,
        } = this.state;
        if (autoLogin) {
          nextAction = this.login;
          if (prevAccount) {
            nextState.prevAccount = prevAccount;
          }
        } else if (value) {
          const {
            onChangeAccount,
          } = this.props;
          nextAction = () => onChangeAccount(value);
        }
        break;
      }
      case 'chainChanged':
      case 'networkChanged':
        nextState.network = value;
        nextState.prevAccount = null;
        nextState.autoLogin = false;
        break;
      case 'aztecAccountChanged': {
        const {
          account,
          network,
        } = window.aztec.web3;
        nextState.account = account;
        nextState.network = network;

        if (value) {
          nextState.aztecAccount = value;
          nextState.refreshingBalances = true;
          nextAction = this.refreshAsset;
        } else if (error) {
          nextState.error = error;
        }
        break;
      }
      default:
    }

    this.setState(
      nextState,
      nextAction,
    );
  };

  login = () => {
    this.setState(
      {
        error: null,
        loggingIn: true,
        autoLogin: true,
      },
      this.enableAztecSdk,
    );
  };

  handleGetTestEth = () => {
    this.setState(
      {
        loadingTestEth: true,
      },
      this.doGetTestEth,
    );
  };

  handleGetTestERC20 = () => {
    this.setState(
      {
        loadingTestERC20: true,
      },
      this.doGetTestERC20,
    );
  };

  ensureAztecLoaded(retry = 10) {
    if (!retry || !this.isAztecAvailable) {
      return;
    }
    if (typeof window.aztec === 'undefined') {
      setTimeout(() => {
        this.ensureAztecLoaded(retry - 1);
      }, 1000);
      return;
    }

    window.ethereum.autoRefreshOnNetworkChange = false;
    window.aztec.autoRefreshOnProfileChange = false;
    window.aztec.addListener('profileChanged', this.handleProfileChanged);

    const aztecAccount = window.aztec.account;
    const {
      account,
      network,
    } = window.aztec.web3;
    const {
      onChangeAccount,
    } = this.props;

    this.setState(
      {
        sdkLoaded: true,
        refreshingBalances: !!aztecAccount,
        aztecAccount,
        account,
        network,
      },
      () => {
        onChangeAccount(account);
        if (aztecAccount) {
          this.refreshAsset();
        }
      },
    );
  }

  async enableAztecSdk() {
    try {
      await window.aztec.enable({
        apiKey: AZTEC_API_KEY,
      });
    } catch (error) {
      console.error('Failed to enable AZTEC SDK.');
      console.log(error);
      this.setState({
        error,
      });
    }
  }

  async doGetTestEth() {
    const {
      setupLogingInIframe,
    } = this.props;

    const frameConsole = await setupLogingInIframe();
    await getTestEth(frameConsole);
    await this.refreshBalances();

    this.setState({
      loadingTestEth: false,
    });
  }

  async doGetTestERC20() {
    const {
      zkAssetAddress,
      setupLogingInIframe,
    } = this.props;

    const frameConsole = await setupLogingInIframe();
    await getTestERC20(zkAssetAddress, frameConsole);
    await this.refreshBalances();

    this.setState({
      loadingTestERC20: false,
    });
  }

  async refreshAsset() {
    const {
      zkAssetAddress,
    } = this.props;
    const asset = await window.aztec.zkAsset(zkAssetAddress);

    this.setState(
      {
        asset,
      },
      this.refreshBalances,
    );
  }

  async refreshBalances() {
    const {
      account,
      asset,
    } = this.state;

    const weiBalance = !account
      ? 0
      : await window.aztec.web3.eth.getBalance(account.address);
    const ethBalance = parseFloat(fromWei(weiBalance)).toFixed(2);

    const linkedTokenBalance = !asset || !asset.valid
      ? 0
      : await asset.balanceOfLinkedToken();

    this.setState({
      ethBalance,
      linkedTokenBalance,
      refreshingBalances: false,
    });
  }

  renderLoginButton(message) {
    return (
      <Button
        className={styles.button}
        theme="primary"
        text={message}
        size="m"
        onClick={this.login}
        expand
      />
    );
  }

  renderMessage(message) { // eslint-disable-line class-methods-use-this
    return (
      <Text
        text={message}
        size="xxs"
      />
    );
  }

  renderLoader(message) { // eslint-disable-line class-methods-use-this
    return (
      <FlexBox
        className="lh0"
        valign="center"
      >
        <Block padding="0 xs">
          <Loader
            theme="white"
            size="xxs"
          />
        </Block>
        {!!message && (
          <Block padding="0 xs">
            <Text
              text={message}
              size="xxs"
            />
          </Block>
        )}
      </FlexBox>
    );
  }

  renderControls() {
    const {
      sdkLoaded,
      loggingIn,
      aztecAccount,
      prevAccount,
      network,
      error,
    } = this.state;

    if (!this.isAztecAvailable) {
      return this.renderMessage('Switch to a browser that has MetaMask installed to use the interactive docs.');
    }

    if (!sdkLoaded) {
      return this.renderLoader('Loading AZTEC SDK...');
    }

    if (error) {
      return this.renderLoginButton('Setup AZTEC');
    }

    if (loggingIn) {
      const loadingMessage = prevAccount
        ? 'Switching AZTEC account...'
        : 'Logging in to AZTEC account...';
      return this.renderLoader(loadingMessage);
    }

    if (network && network.name !== REQUIRED_NETWORK) {
      return this.renderMessage(`Please switch your wallet's network to ${REQUIRED_NETWORK} to use the interactive docs.`);
    }

    if (!aztecAccount) {
      return this.renderLoginButton('Setup AZTEC');
    }

    const {
      onRunCode,
      isRunning,
    } = this.props;
    const {
      ethBalance,
      linkedTokenBalance,
      refreshingBalances,
      loadingTestEth,
      loadingTestERC20,
    } = this.state;

    return (
      <FlexBox
        align="space-between"
        stretch
        expand
      >
        <FlexBox
          align="flex-start"
          valign="center"
        >
          <Block padding="0 l">
            <Text
              text={refreshingBalances ? 'Updating ETH' : `${ethBalance} ETH`}
              color="white-lighter"
              size="xs"
            />
          </Block>
          <Button
            className={classnames(styles.flatButton, {
              [styles.disabled]: refreshingBalances,
            })}
            text="Get ETH"
            size="m"
            onSubmit={this.handleGetTestEth}
            isLoading={loadingTestEth}
            disabled={refreshingBalances}
            icon={<Icon name="local_gas_station" size="m" />}
          />
          <Block padding="0 l">
            <Text
              text={refreshingBalances ? 'Updating ERC20' : `${linkedTokenBalance} ERC20`}
              color="white-lighter"
              size="xs"
            />
          </Block>
          <Button
            className={classnames(styles.flatButton, {
              [styles.disabled]: refreshingBalances,
            })}
            text="Get ERC20 tokens"
            size="m"
            onSubmit={this.handleGetTestERC20}
            isLoading={loadingTestERC20}
            disabled={refreshingBalances}
          />
        </FlexBox>
        <Button
          className={styles.button}
          text="Run Code"
          size="m"
          onSubmit={onRunCode}
          isLoading={isRunning}
          icon={<Icon name="eject" size="m" rotate={90} />}
        />
      </FlexBox>
    );
  }

  render() {
    const {
      children,
    } = this.props;
    const {
      account,
      network,
    } = this.state;

    return (
      <div>
        <Block
          padding="xs m"
          hasBorderBottom
        >
          <FlexBox align="space-between">
            <FlexBox aling="flex-start">
              <Text
                text="Ethereum Address:"
                size="xs"
              />
              <Block left="s">
                <Text
                  text={(account && account.address) || ''}
                  size="xs"
                  color="grey"
                />
              </Block>
            </FlexBox>
            <Text
              text={(network && network.name) || ''}
              size="xs"
              color="orange"
            />
          </FlexBox>
        </Block>
        {children}
        <Block
          className={styles.controls}
          background="grey-darker"
        >
          {this.renderControls()}
        </Block>
      </div>
    );
  }
}

SdkPlaygroundControls.propTypes = {
  zkAssetAddress: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isRunning: PropTypes.bool.isRequired,
  onRunCode: PropTypes.func.isRequired,
  setupLogingInIframe: PropTypes.func.isRequired,
  onChangeAccount: PropTypes.func.isRequired,
};

export default SdkPlaygroundControls;
