import React, { Component } from 'react';

import browser from 'webextension-polyfill';
import { Mutation } from 'react-apollo';
import {
    Loader, Block, Button, Text,
} from '@aztec/guacamole-ui'; import actionModel from '~database/models/action';
import RegisterExtension from './mutations/RegisterExtension';
import '@aztec/guacamole-ui/dist/styles/guacamole.css';
import Login from './mutations/Login';
import ApproveAssetForDomain from './mutations/ApproveDomain';

class App extends Component {
    state ={

    }

    componentDidMount() {
        const search = new URLSearchParams(window.location.search);
        actionModel.get({ timestamp: search.get('id') })
            .then((resp) => {
                this.setState({ action: resp });
            });
    }


    render() {
        if (!this.state.action) {
            return (
                <Loader
                    theme="primary"
                    hasBackground
                />
            );
        }

        const actionMap = {
            'ui.register.extension': {
                mutation: RegisterExtension,
                buttonText: 'Register',
                onClick: mutation => async () => {
                    const data = await mutation({
                        variables: {
                            password: 'password',
                            salt: 'salt',
                            domain: 'test',
                            address: this.state.action.data.response.currentAddress,
                        },
                    });
                    browser.runtime.sendMessage({
                        type: 'UI_CONFIRM',
                        requestId: this.state.action.data.requestId,
                        data,
                    });
                    window.close();
                },
                text: () => 'You need to set up the AZTEC extension to continue',
            },
            'ui.account.login': {
                mutation: Login,
                buttonText: 'Login',
                onClick: mutation => async () => {

                },
                text: () => 'You need to login to continue',
            },
            'ui.asset.approve': {
                mutation: ApproveAssetForDomain,
                buttonText: 'Approve',
                onClick: mutation => async () => {
                    const data = await mutation({
                        variables: {
                            domain: this.state.action.data.response.domain,
                            asset: this.state.action.data.response.asset,
                        },
                    });
                    browser.runtime.sendMessage({
                        type: 'UI_CONFIRM',
                        requestId: this.state.action.data.requestId,
                        data,
                    });
                    window.close();
                },
                text: ({ asset, domain }) => `${domain} is requesting access to your balance of ${asset}`,
            },
        };
        return (
            <div className="App">
                <Block background="primary" stretch padding="xl" align="center">

                    <Mutation mutation={actionMap[this.state.action.type].mutation}>
                        {(mutation, { data }) => (
                            <div>
                                <Text text={actionMap[this.state.action.type].text(this.state.action.data.response)} />
                                <br />
                                <br />
                                <Button
                                    text={actionMap[this.state.action.type].buttonText}
                                    onClick={actionMap[this.state.action.type].onClick(mutation)}
                                />
                            </div>
                        )
                        }

                    </Mutation>
                </Block>

            </div>
        );
    }
}

export default App;
