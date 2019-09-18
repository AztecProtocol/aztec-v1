import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Loader, Block, Button,
} from '@aztec/guacamole-ui';
import { withRouter } from 'react-router-dom';
import ExtensionApi from '../../services/ExtensionApiService';

import { KeyStore } from '~utils/keyvault';


class RegisterExtension extends Component {
    state ={
    }

    async linkAccountToMetaMask() {
        const {
            action: {
                clientId,
                requestId,
                data: {
                    response: {
                        address,
                    },
                },
            },
        } = this.props;
        const {
            account,
        } = this.state;
        const {
            data: {
                signature,
            },
        } = await ExtensionApi.auth.linkAccountToMetaMask({
            account: {
                ...account,
                address,
            },
            requestId,
            clientId,
        });
        this.setState({
            signature,
        });
    }

    async createKeyVault() {
        const seedPhrase = KeyStore.generateRandomSeed(Date.now().toString());
        // here we are going to use the resolvers to create the key vault
        const {
            action: {
                data: {
                    response: {
                        address,
                    },
                },
            },
        } = this.props;
        const {
            password = 'test',
        } = this.state;

        const account = await ExtensionApi.auth.createKeyVault({
            address,
            password,
            seedPhrase,
        });

        this.setState({
            account: {
                ...account,
                address,
            },
        });
    }

    async sendTransaction() {
        const {
            account: {
                address,
                linkedPublicKey,
            },
            signature,
        } = this.state;
        const {
            action: {
                clientId,
                requestId,
            },
        } = this.props;
        await ExtensionApi.auth.sendRegisterTransaction({
            params: {
                address,
                linkedPublicKey,
                signature,
            },
            requestId,
            clientId,

        });
    }

    async registerAccount() {
        const {
            account: {
                address,
                linkedPublicKey,
            },
            signature,
        } = this.state;
        await ExtensionApi.auth.registerAccount({
            address,
            linkedPublicKey,
            signature,
        });
    }


    render() {
        const {
            action,
        } = this.props;
        if (!action) {
            return (
                <Block style={{
                    background: 'linear-gradient(115deg, #808DFF 0%, #9FC4FF 100%, #7174FF 100%)',
                }}
                >
                    <Loader
                        theme="primary"
                        hasBackground
                    />
                </Block>
            );
        }

        // we want to always render a router depending on the page we want to handle the url
        // we then render a react router and parse the query string for handling actions.
        // the extension ui will have a different flow

        return (
            <Block
                background="white"
                stretch
                padding="m"
            >
                <Button
                    text="Create Key Vault"
                    onClick={() => this.createKeyVault()}
                />

                <br />
                <br />
                <Button
                    text="Link account to MetaMask"
                    onClick={() => this.linkAccountToMetaMask()}
                />
                <br />
                <br />
                <Button
                    text="Send Transaction"
                    onClick={() => this.sendTransaction()}
                />
                <br />
                <br />
                <Button
                    text="Register Account"
                    onClick={() => this.registerAccount()}
                />
            </Block>
        );
    }
}

RegisterExtension.defaultProps = {
    action: false,
};

RegisterExtension.propTypes = {
    action: PropTypes.any,
};

export default withRouter(RegisterExtension);
