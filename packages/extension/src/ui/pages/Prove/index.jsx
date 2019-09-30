import React, { Component } from 'react';
import {
    Loader,
    Block,
    Button,
    Text,
    Accordion,
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

    deposit = async () => {
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

        const { proof } = await ExtensionApi.prove.deposit({
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

    send = async () => {
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

        const { proof } = await ExtensionApi.prove.send({
            assetAddress,
            sender,
            transactions,
            currentAddress: from,
            domain: window.location.origin,
        });
        console.log(proof);
        const encoded = proof.encodeABI(assetAddress);
        this.setState({
            sendProof: encoded,
            proofHash: proof.hash,
        });
    }

    sendDepositProof= async () => {
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
        console.log({ receipt });
        ExtensionApi.prove.returnToClient({
            requestId,
            clientId,
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
                <Accordion
                    title={(
                        <Text
                            size="m"
                            text="Deposit"
                            weight="bold"
                        />
                    )}
                    content={(
                        <Block>

                            <div>
                                <br />
                                <br />
                                <Button
                                    text="Deposit"
                                    onClick={() => this.deposit()}
                                />
                            </div>
                            <div>
                                <br />
                                <br />
                                <Button
                                    text="Approve Deposit ERC20"
                                    onClick={() => this.publicApprove()}
                                />
                            </div>
                            <div>
                                <br />
                                <br />
                                <Button
                                    text="Send Desposit"
                                    onClick={() => this.sendDepositProof()}
                                />
                            </div>
                        </Block>
                    )}
                />
                <Accordion
                    title={(
                        <Text
                            size="m"
                            text="Withdraw"
                            weight="bold"
                        />
                    )}
                    content={(
                        <Block>

                            <div>
                                <br />
                                <br />
                                <Button
                                    text="Generate Proof"
                                    onClick={() => this.withdraw()}
                                />
                            </div>
                            <div>
                                <br />
                                <br />
                                <Button
                                    text="Sign Notes"
                                    onClick={() => this.signNotes()}
                                />
                            </div>
                            <div>
                                <br />
                                <br />
                                <Button
                                    text="Send Withdraw"
                                    onClick={() => this.sendWithdraw()}
                                />
                            </div>
                        </Block>
                    )}
                />
            </Block>
        );
    }
}

export default Prove;
