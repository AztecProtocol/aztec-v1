import React, { Component } from 'react';
import browser from 'webextension-polyfill';
import { Mutation } from 'react-apollo';
import RegisterExtension from './mutations/RegisterExtension';
import Login from './mutations/Login';
import ApproveAssetForDomain from './mutations/ApproveDomain';

class App extends Component {
    render() {
        return (
            <div className="App">
                <h1>
                    AZTEC Extension
                </h1>
                <hr />
                <br />

                <Mutation mutation={RegisterExtension}>
                    {(registerExtension, { data }) => (
                        <div>
                            <button onClick={async () => {
                                console.log(registerExtension);
                                const reqId = prompt('Req Id');
                                await registerExtension({
                                    variables: {
                                        password: 'password',
                                        salt: 'salt',
                                        domain: 'test',
                                    },
                                });
                                browser.runtime.sendMessage({
                                    type: 'UI_CONFIRM',
                                    requestId: reqId,
                                });
                            }}
                            >
                        Register Extension
                            </button>
                        </div>
                    )
                    }

                </Mutation>
                <br />
                <Mutation mutation={Login}>
                    {(login, { data }) => (
                        <div>
                            <button onClick={async () => {
                                const reqId = prompt('Req Id');
                                await login({
                                    variables: {
                                        password: 'password',
                                        domain: 'test',
                                    },
                                });
                                browser.runtime.sendMessage({
                                    type: 'UI_CONFIRM',
                                    requestId: reqId,
                                });
                            }}
                            >
                        Login
                            </button>
                        </div>
                    )
                    }

                </Mutation>
                <br />
                <Mutation mutation={ApproveAssetForDomain}>
                    {(approveAssetForDomain, { data }) => (
                        <div>
                            <button onClick={async () => {
                                const reqId = prompt('Req Id');
                                await approveAssetForDomain({
                                    variables: {
                                        asset: '__asset__01__',
                                        domain: 'test',
                                    },
                                });
                                browser.runtime.sendMessage({
                                    type: 'UI_CONFIRM',
                                    requestId: reqId,
                                });
                            }}
                            >
                        Approve Domain
                            </button>
                        </div>
                    )
                    }
                </Mutation>
            </div>
        );
    }
}

export default App;
