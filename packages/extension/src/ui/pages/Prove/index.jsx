import React, { Component } from 'react';
import {
    Loader,
    Block,
    Button,
    Text,
} from '@aztec/guacamole-ui';
import assetModel from '~database/models/asset';

import ExtensionApi from '../../services/ExtensionApiService';

import './Prove.css';


class Prove extends Component {
    state ={

    }

    publicApprove = async () => {
        const {
            action: {
                clientId,
                requestId,
                data: {
                    assetAddress,
                    transactions,
                },
            },
            address,
        } = this.props;

        const {
            proofHash,
        } = this.state;

        const amount = transactions.reduce((accum, { amount }) => accum + amount, 0);

        const { proof } = await ExtensionApi.prove.publicApprove({
            clientId,
            requestId,
            proofHash,
            amount,
            assetAddress,
        });
    }

    prove = async () => {
        const {
            action: {
                data: {
                    assetAddress,
                    transactions,
                    from,
                    sender,
                },
            },
            address,
        } = this.props;

        const { proof } = await ExtensionApi.prove.depositProof({
            assetAddress,
            sender,
            owner: from,
            publicOwner: from,
            transactions,
            currentAddress: from,
            domain: window.location.origin,
        });
        const encoded = proof.encodeABI(assetAddress);
        this.setState({
            depositProof: encoded,
            proofHash: proof.hash,
        });
    }

    sendProof= async () => {
        const {
            depositProof,
        } = this.state;

        const {
            action: {
                clientId,
                requestId,
                data: {
                    assetAddress,
                },
            },
        } = this.props;

        const receipt = await ExtensionApi.prove.sendDepositProof({
            params: {
                proofData: depositProof,
                assetAddress,
            },
            requestId,
            clientId,

        });
        console.log(receipt);
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
                        text="Prove"
                        onClick={() => this.prove()}
                    />
                </div>
                <div>
                    <br />
                    <br />
                    <Button
                        text="Approve ERC20"
                        onClick={() => this.publicApprove()}
                    />
                </div>
                <div>
                    <br />
                    <br />
                    <Button
                        text="Send Proof"
                        onClick={() => this.sendProof()}
                    />
                </div>
            </Block>
        );
    }
}

export default Prove;
