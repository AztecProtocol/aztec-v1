import React, { Component } from 'react';

import browser from 'webextension-polyfill';
import { Mutation } from 'react-apollo';
import {
    Loader, Block, Button, Text, TextInput,
} from '@aztec/guacamole-ui';

import Login from '../../mutations/Login.js';


class ApproveAssetForDomain extends Component {
    state ={

    }

    __updatePassword(value) {
        this.setState({ password: value });
    }

    __handleLogin = async (mutation) => {
        const {
            action: {
                data: {
                    requestId,
                    response: {
                        currentAddress,
                    },
                },
            },
        } = this.props;

        const data = await mutation({
            variables: {
                address: currentAddress.toLowerCase(),
                password: this.state.password,
                domain: window.location.host,
            },
        });
        browser.runtime.sendMessage({
            type: 'UI_CONFIRM',
            requestId,
            data,
        });
        setTimeout(() => {
            window.close();
        }, 1000);
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
                stretch
                padding="xl"
                align="center"
                background="white"
            >

                <Text
                    text="Login"
                    size="l"
                    color="primary"
                    weight="semibold"
                />
                <Block padding="l xl">
                    <TextInput type="password" placeholder="Enter password..." onChange={e => this.__updatePassword(e)} />
                </Block>
                <Mutation mutation={Login}>
                    {(mutation, { data }) => (
                        <div>
                            <br />
                            <br />
                            <Button
                                text="Login"
                                onClick={() => this.__handleLogin(mutation)}
                            />
                        </div>
                    )
                    }

                </Mutation>
            </Block>
        );
    }
}

export default ApproveAssetForDomain;
