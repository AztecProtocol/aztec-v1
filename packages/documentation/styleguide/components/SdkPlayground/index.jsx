import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Hook, Console, Decode, Unhook } from 'console-feed';
import { Block, FlexBox, TextButton } from '@aztec/guacamole-ui';
import debounce from 'lodash/debounce';
import Editor from 'react-styleguidist/lib/client/rsg-components/Editor';
import classnames from 'classnames';
import { keccak256, toChecksumAddress } from 'web3-utils';
import { AZTEC_API_KEY, DEMO_ZK_ASSET_ADDRESS, DEMO_ZK_DAI_ADDRESS, DEMO_THIRD_PARTY_ADDRESS } from '../../config/aztec';
import { PERMITTED_LOGS, CONSOLE_STYLES } from '../../config/console';
import compileCode from '../../utils/compileCode';
import replaceVarInCode from './utils/replaceVarInCode';
import SdkPlaygroundControls from './SdkPlaygroundControls';
import styles from './sdk-playground.module.scss';

class SdkPlayground extends PureComponent {
    static getDerivedStateFromProps(nextProps, prevState) {
        const { initialCode, zkAssetAddress } = prevState;
        const { code } = nextProps;

        if (initialCode === code) {
            return null;
        }

        let newCode = code;
        newCode = replaceVarInCode(newCode, 'apiKey', AZTEC_API_KEY);
        newCode = replaceVarInCode(newCode, 'zkAssetAddress', zkAssetAddress);
        newCode = replaceVarInCode(newCode, 'zkDaiAddress', DEMO_ZK_DAI_ADDRESS);
        newCode = replaceVarInCode(newCode, 'thirdPartyAddress', DEMO_THIRD_PARTY_ADDRESS);

        return {
            code: newCode,
            initialCode: code,
            logs: [],
        };
    }

    handleChangeCode = debounce((code) => {
        this.setState({ code });
    }, 100);

    state = {
        iframeId: 0,
        logs: [],
        code: '',
        initialCode: '',
        isRunning: false,
        zkAssetAddress: DEMO_ZK_ASSET_ADDRESS,
    };

    componentWillUnmount() {
        // Clear pending changes
        Unhook(window.console);
    }

    setIframeRef = (ref) => {
        this.iframeRef = ref;
    };

    setConsoleRef = (ref) => {
        this.consoleRef = ref;
    };

    generateIframeContent = () => {
        const { compilerConfig } = this.props;
        const { code } = this.state;

        // all calls to window.aztec need to go to the parent window,
        // as SDK not loaded in this iframe
        const compiledCode = compileCode(code, compilerConfig, console.log)
            .replace(/window.aztec/g, 'window.parent.aztec')
            .replace(/window.ethereum/g, 'window.parent.ethereum');

        const asyncCompiledCode = `
      const code = async () => {
        try {
          ${compiledCode};
        } catch(err) {
          console.error(err);
        }
        window.parent.postMessage('EXAMPLE_RAN');
      };
      code();
    `;

        const iframeDoc = `
      <html>
        <head>
          <script>
            const delayRun = (time) => {
              setTimeout(async () => {
                ${asyncCompiledCode};
              }, time);
            };
            delayRun(500); // wait for hookConsoleLogs to be called
          </script>
        </head>
        <body></body>
      </html>
    `;

        return iframeDoc;
    };

    handleStartLogging = async () =>
        new Promise((resolve) => {
            this.setState(
                {
                    logs: [],
                },
                () => {
                    const frameConsole = this.hookConsoleLogs();
                    resolve(frameConsole);
                },
            );
        });

    handleRunCode = () => {
        const { isRunning, code } = this.state;
        if (isRunning) return;

        const iframeId = keccak256(code).slice(5);

        this.setState(
            {
                iframeId,
                isRunning: true,
                logs: [],
            },
            this.doRunCode,
        );
    };

    handleRefreshAccountCode = (account) => {
        const { code } = this.state;
        const { address } = account || {};
        const userAddress = (address && toChecksumAddress(address)) || '';
        const updatedCode = code.replace(/userAddress = '(0x)?[0-9a-f]{0,}'/g, `userAddress = '${userAddress}'`);

        this.setState({
            code: updatedCode,
        });
    };

    hookConsoleLogs() {
        const frameConsole = this.iframeRef.contentWindow.console;
        Unhook(frameConsole);
        Hook(frameConsole, (log) => {
            const decodedLog = Decode(log);
            if (PERMITTED_LOGS.indexOf(decodedLog.method) > -1) {
                const { logs: prevLogs } = this.state;

                this.setState(
                    {
                        logs: [...prevLogs, decodedLog],
                    },
                    this.scrollLogs,
                );
            }
        });
        return frameConsole;
    }

    scrollLogs() {
        if (this.consoleRef) {
            this.consoleRef.scrollTop = this.consoleRef.scrollHeight;
        }
    }

    async doRunCode() {
        await this.compileCodeInIframe();
        this.setState({
            isRunning: false,
        });
    }

    async compileCodeInIframe() {
        this.iframeRef.srcdoc = this.generateIframeContent();
        const iframeLoaded = new Promise((resolve) => {
            this.iframeRef.onload = resolve;
        });
        await iframeLoaded;

        this.hookConsoleLogs();

        return new Promise((resolve) => {
            window.addEventListener('message', (event) => {
                if (event.data === 'EXAMPLE_RAN') {
                    resolve(event);
                }
            });
        });
    }

    render() {
        const { isRunning, iframeId, logs, code, zkAssetAddress } = this.state;

        return (
            <>
                <iframe ref={this.setIframeRef} id={iframeId} title="code" height="0" width="0" style={{ display: 'none' }} />
                <FlexBox align="flex-end">
                    <TextButton size="s" href="https://discord.gg/wtTgTZk" text="Need help? Join our DISCORD!" />
                </FlexBox>
                <Block className={styles.wrapper} background="white" borderRadius="xs" hasBorder>
                    <SdkPlaygroundControls
                        zkAssetAddress={zkAssetAddress}
                        onRunCode={this.handleRunCode}
                        isRunning={isRunning}
                        frameConsole={(this.iframeRef && this.iframeRef.contentWindow.console) || null}
                        setupLogingInIframe={this.handleStartLogging}
                        onChangeAccount={this.handleRefreshAccountCode}
                    >
                        <div
                            className={classnames(styles.code, {
                                [styles.codeRunning]: isRunning,
                            })}
                        >
                            <Editor code={code} onChange={this.handleChangeCode} />
                        </div>
                        {logs.length > 0 && (
                            <Block className={styles.logs} padding="m s" background="grey-darker">
                                <div ref={this.setConsoleRef}>
                                    <Console logs={logs} variant="dark" filter={PERMITTED_LOGS} styles={CONSOLE_STYLES} />
                                </div>
                            </Block>
                        )}
                    </SdkPlaygroundControls>
                </Block>
            </>
        );
    }
}

SdkPlayground.propTypes = {
    code: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
    compilerConfig: PropTypes.object,
};

SdkPlayground.defaultProps = {
    compilerConfig: {},
};

export default SdkPlayground;
