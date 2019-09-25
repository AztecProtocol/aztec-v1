import React, { Component } from 'react';
import {
    Block,
} from '@aztec/guacamole-ui';
import {
    Subject,
} from 'rxjs';
import { Route, withRouter } from 'react-router-dom';
import browser from 'webextension-polyfill';
import {
    get,
} from '~utils/storage';
import { randomId } from '~utils/random';
import '@aztec/guacamole-ui/dist/styles/guacamole.css';

/*eslint-disable */
import Login from './pages/Login/index.jsx';
import Home from './pages/Home/index.jsx';
import Register from './pages/Register/index.jsx';
import ApproveAsset from './pages/ApproveAsset/index.jsx';
import Deposit from './pages/Deposit/index.jsx';
import Prove from './pages/Prove/index.jsx';
/* eslint-enable */

import actionModel from '~database/models/action';

import AuthService from '../background/services/AuthService';
import GraphNodeService from '~background/services/GraphNodeService';


const actionToRouteMap = {

    'ui.register.extension': '/register',
    'ui.asset.approve': '/approveAsset',
    'ui.account.login': '/login',
    'ui.asset.prove': '/prove',

};

class App extends Component {
    state ={

    }

    componentDidMount() {
        const clientId = randomId();

        this.backgroundPort = browser.runtime.connect({
            name: clientId,
        });

        this.backgroundSubject = new Subject();
        const background$ = this.backgroundSubject.asObservable();

        this.backgroundPort.onMessage.addListener((msg, sender) => {
            this.backgroundSubject.next(msg);
        });

        const search = new URLSearchParams(window.location.search);
        AuthService.getCurrentUser().then((resp) => {
            if (resp) {
                this.setState({
                    address: resp.address,
                });
            }
        });
        get('__graphNode').then((resp) => {
            GraphNodeService.set({
                graphNodeServerUrl: resp,
            });
        });
        actionModel.get({ timestamp: search.get('id') })
            .then((resp) => {
                this.props.history.push(actionToRouteMap[resp.type]);
                setTimeout(() => {
                    this.setState({ action: resp });
                }, 1000);
            });
    }

    render() {
        return (
            <div className="App">
                <Block
                    background="primary"
                    stretch
                    padding="0"
                    align="center"
                    style={{
                        background: 'linear-gradient(115deg, #808DFF 0%, #9FC4FF 100%, #7174FF 100%)',
                    }}
                >
                    <Route
                        path="/"
                        render={props => (<Home action={this.state.action} />)}
                    />
                    <Route
                        path="/prove"
                        render={props => (<Prove action={this.state.action} />)}
                    />
                    <Route
                        path="/login"
                        render={() => (<Login action={this.state.action} />)}
                    />
                    <Route
                        path="/register"
                        render={() => (<Register action={this.state.action} subject={this.backgroundSubject} port={this.backgroundPort} />)}
                    />
                    <Route
                        path="/approveAsset"
                        render={() => (<ApproveAsset action={this.state.action} address={this.state.address} />)}
                    />
                    <Route
                        path="/deposit"
                        render={() => (<Deposit action={this.state.action} />)}
                    />

                </Block>

            </div>
        );
    }
}
export default withRouter(App);
