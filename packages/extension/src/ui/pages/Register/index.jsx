import React, { Component } from 'react';

import browser from 'webextension-polyfill';
import {
    Loader, Block, Button, Text,
} from '@aztec/guacamole-ui';
import { Route, withRouter } from 'react-router-dom';

import { KeyStore } from '~utils/keyvault';

import Step1 from './step1.jsx';
import Step2 from './step2.jsx';
import Step3 from './step3.jsx';
import Restore from './restore.jsx';


class RegisterExtension extends Component {
    state ={
    }


    __handleStep3Click = (mutation, password) => async () => {
        const data = await mutation({
            variables: {
                password,
                salt: 'salt',
                domain: window.location.host,
                seedPhrase: this.state.seedPhrase,
                address: this.props.action.data.response.address,
            },
        });
        browser.runtime.sendMessage({
            type: 'UI_RESPONSE',
            requestId: this.props.action.data.requestId,
            data,
        });
        setTimeout(() => {
            window.close();
        }, 1000);
    };

    __handleStep2Click() {
        this.props.history.push('/register/step3');
    }

    __handleRestoreClick() {
        console.log('here');
        this.props.history.push('/register/restore');
    }

    __updateSeedPhrase(seedPhrase) {
        this.setState({ seedPhrase });
        this.props.history.push('/register/step2');
    }

    __handleStep1Click() {
        const seedPhrase = KeyStore.generateRandomSeed(Date.now().toString());

        this.setState({ seedPhrase });
        this.props.history.push('/register/step2');
    }

    render() {
        if (!this.props.action) {
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
                align="center"
            >
                <Route
                    path="/register"
                    exact
                    render={() => (
                        <Step1
                            onClick={() => this.__handleStep1Click()}
                            restoreClick={() => this.__handleRestoreClick()}
                        />
                    )}
                />
                <Route
                    path="/register/restore"
                    exact
                    render={() => (
                        <Restore
                            updateSeedPhrase={seedPhrase => this.__updateSeedPhrase(seedPhrase)}
                        />
                    )}
                />
                <Route
                    path="/register/step2"
                    exact
                    render={p => (<Step2 onClick={() => this.__handleStep2Click()} seedPhrase={this.state.seedPhrase} />)}
                />
                <Route
                    path="/register/step3"
                    exact
                    render={() => (<Step3 onClick={this.__handleStep3Click} />)}
                />
            </Block>
        );
    }
}

export default withRouter(RegisterExtension);
