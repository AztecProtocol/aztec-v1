import React, { Component } from 'react';
import browser from 'webextension-polyfill';
import { Mutation } from 'react-apollo';
import actionModel from '~database/models/action';
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
                                const search = new URLSearchParams(window.location.search);
                                const action =  await actionModel.get({timestamp: search.get('id')});
                                const data = await registerExtension({
                                    variables: {
                                        password: 'password',
                                        salt: 'salt',
                                        domain: 'test',
                                        address: action.data.response.currentAddress
                                    },
                                });
                                console.log(data);
                                browser.runtime.sendMessage({
                                    type: 'UI_CONFIRM',
                                    requestId: action.data.requestId,
                                    data
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
