import React, { Component } from 'react';
import browser from 'webextension-polyfill';
import GraphService from '../background/services/GraphQLService';

class App extends Component {
    render() {
        return (
            <div className="App">
                <h1> Hello! </h1>
                <button onClick={() => {
                    browser.runtime.sendMessage({ type: 'UI_CONFIRM' });
                }}
                >
Register Extension
                </button>
                <button onClick={() => {
                    browser.runtime.sendMessage({ type: 'UI_CONFIRM' });
                }}
                >
Login
                </button>

                <button onClick={() => {
                    const reqId = prompt('Req Id');
                    console.log(reqId);
                    // appolo mutation

                    browser.runtime.sendMessage({
                        type: 'UI_CONFIRM',
                        action: 'login',
                        query: {
                            user: 'u', password: 'p',
                        },
                        requestId: reqId,

                    });
                }}
                >
Approve Domain
                </button>
            </div>
        );
    }
}

export default App;
