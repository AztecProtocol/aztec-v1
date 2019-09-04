import React, { Component } from 'react';

import browser from 'webextension-polyfill';
import { Mutation } from 'react-apollo';
import {
    Loader, Block, Button, Text,
} from '@aztec/guacamole-ui';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import actionModel from '~database/models/action';
import ApproveDomainMutatuon from '../../mutations/ApproveDomain';

import './Deposit.css';


class Deposit extends Component {
    state ={

    }

    __handleApproveDomain = async (mutation) => {
        const {
            action: {
                data: {
                    requestId,
                    response,
                },
            },
        } = this.props;

        const data = await mutation({
            variables: {
            },
        });
        browser.runtime.sendMessage({
            type: 'UI_RESPONSE',
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

        const {
            action: {
                data: {
                    response,
                },
            },
        } = this.props;
        return (
            <Block
                stretch
                padding="xl"
                align="center"
                background="white"
            >

                <Text
                    text="Deposit Proof"
                    size="l"
                    color="primary"
                    weight="semibold"
                />
                <Button
                    text="Generate"
                    onClick={() => this.__handleApproveDomain(mutation)}
                />
            </Block>
        );
    }
}

export default Deposit;
