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
            clientId,
            requestId,
            assetAddress,
            transactions,
            currentAddress,
        } = this.props;

        const {
            proofHash,
        } = this.state;

        const amount = transactions.reduce((accum, { amount }) => accum + amount, 0);
const { proof } = await ExtensionApi.prove.publicApprove({ clientId,
            requestId,
            proofHash,
            amount,
            assetAddress,
        });
    }

    deposit = async () => {
        const {
            assetAddress,
            transactions,
            from,
            sender,
            currentAddress,
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
            assetAddress,
            transactions,
            from,
            sender,
            currentAddress,
        } = this.props;

        const { proof } = await ExtensionApi.prove.send({
            assetAddress,
            sender,
            transactions,
            currentAddress: from,
            domain: window.location.origin,
        });
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
            clientId,
            requestId,
            assetAddress,
        } = this.props;

        const receipt = await ExtensionApi.prove.sendTransferProof({
            params: {
                proofData: depositProof,
                assetAddress,
            },
            requestId,
            clientId,

        });
        ExtensionApi.prove.returnToClient({
            requestId,
            clientId,
        });
    }

    transfer = async () => {
        const {
            assetAddress,
            from,
            transactions,
            sender,
            currentAddress,
        } = this.props;

        const { proof } = await ExtensionApi.prove.transfer({
            assetAddress,
            sender,
            from,
            transactions,
            currentAddress,
            domain: window.location.origin,
        });
        const encoded = proof.encodeABI(assetAddress);
        this.setState({
            transferProof: encoded,
            proofHash: proof.hash,
            challenge: proof.challengeHex,
            noteHashes: proof.notes.map(({ noteHash }) => noteHash),
        });

    }

    withdraw = async () => {
        const {
            assetAddress,
            amount,
            from,
            to,
            sender,
            currentAddress,
        } = this.props;

        const { proof } = await ExtensionApi.prove.withdraw({
            assetAddress,
            sender,
            from,
            to,
            amount,
            publicOwner: to,
            currentAddress,
            domain: window.location.origin,
        });
        const encoded = proof.encodeABI(assetAddress);
        this.setState({
            transferProof: encoded,
            proofHash: proof.hash,
            challenge: proof.challengeHex,
            noteHashes: proof.notes.map(({ noteHash }) => noteHash),
        });
    }

    signNotes = async () => {
        const {
            noteHashes,
            challenge,
        } = this.state;

        const {
            assetAddress,
            currentAddress,
            clientId,
            requestId,
        } = this.props;

        const {
            data: {
                response: {
                    signatures,
                },
            },
        } = await ExtensionApi.prove.signNotes({
            noteHashes,
            sender: currentAddress,
            assetAddress,
            requestId,
            challenge,
            clientId,
        });
        this.setState({ signatures: signatures.reduce((accum, sig) => accum + sig.slice(2), '0x') });
    }

    sendTransferProof = async () => {
        const {
            transferProof,
            signatures,
        } = this.state;

        const {
            clientId,
            requestId,
            assetAddress,
        } = this.props;

        const receipt = await ExtensionApi.prove.sendTransferProof({
            params: {
                proofData: transferProof,
                assetAddress,
                signatures,
            },
            requestId,
            clientId,

        });
        ExtensionApi.prove.returnToClient({
            requestId,
            clientId,
        });
    }

    mint = async () => {
        const {
            assetAddress,
            transactions,
            sender,
            currentAddress,
        } = this.props;

        const { proof } = await ExtensionApi.prove.mint({
            assetAddress,
            sender,
            transactions,
            currentAddress,
            domain: window.location.origin,
        });
        const encoded = proof.encodeABI(assetAddress);
        this.setState({
            mintProof: encoded,
            proofHash: proof.hash,
        });
    }

    sendMintProof = async() => {
        const {
            mintProof,
        } = this.state;

        const {
            clientId,
            requestId,
            assetAddress,
        } = this.props;

        const receipt = await ExtensionApi.prove.sendMintProof({
            params: {
                proofData: mintProof,
                assetAddress,
            },
            requestId,
            clientId,

        });
        ExtensionApi.prove.returnToClient({
            requestId,
            clientId,
        });

    }

    render() {
        if (!this.props.requestId) {
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
                defaultIsOpen={false}
                title={(
                    <Text
                        size="m"
                        text="Mint"
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
                                onClick={() => this.mint()}
                            />
                        </div>
                        <div>
                            <br />
                            <br />
                            <Button
                                text="Send Mint Proof"
                                onClick={() => this.sendMintProof()}
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
