import React, { Component } from 'react';
import {
    Block,
} from '@aztec/guacamole-ui';
import { Route, withRouter } from 'react-router-dom';
import '@aztec/guacamole-ui/dist/styles/guacamole.css';

import Login from './pages/Login/index.jsx';
import Home from './pages/Home/index.jsx';
import Register from './pages/Register/index.jsx';
import ApproveAsset from './pages/ApproveAsset/index.jsx';

import actionModel from '~database/models/action';

const actionToRouteMap = {

    'ui.register.extension': '/register',
    'ui.asset.approve': '/approveAsset',
    'ui.account.login': '/login',

};

class App extends Component {
    state ={

    }

    componentDidMount() {
        const search = new URLSearchParams(window.location.search);
        actionModel.get({ timestamp: search.get('id') })
            .then((resp) => {
                this.props.history.push(actionToRouteMap[resp.type]);
                console.log(actionToRouteMap[resp.type]);
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
                        path="/login"
                        render={() => (<Login action={this.state.action} />)}
                    />
                    <Route
                        path="/register"
                        render={() => (<Register action={this.state.action} />)}
                    />
                    <Route
                        path="/approveAsset"
                        render={() => (<ApproveAsset action={this.state.action} />)}
                    />

                </Block>

            </div>
        );
    }
}
export default withRouter(App);
