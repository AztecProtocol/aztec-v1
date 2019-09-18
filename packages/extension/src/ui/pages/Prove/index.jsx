import React, { Component } from 'react';
import {
    Loader,
    Block,
    Button,
    Text,
} from '@aztec/guacamole-ui';

import ExtensionApi from '../../services/ExtensionApiService';

import './Prove.css';


class Prove extends Component {
    state ={

    }

    prove = async () => {
        const {
            action: {
                data: {
                    response: {
                        domain,
                        asset,
                    },
                },
            },
            address,
        } = this.props;
        await ExtensionApi.auth.approveDomain({
            domain,
            address,
        });
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
        return (
            <Block
                stretch
                padding="xl"
                align="center"
                background="white"
            >

                <div>
                    <br />
                    <br />
                    <Button
                        text="Approve ERC20"
                        onClick={() => this.approveDomain()}
                    />
                </div>
                <div>
                    <br />
                    <br />
                    <Button
                        text="Prove"
                        onClick={() => this.approveDomain()}
                    />
                </div>
            </Block>
        );
    }
}

export default Prove;
