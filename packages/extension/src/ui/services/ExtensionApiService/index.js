import ApolloClient from 'apollo-client';
import aztec from 'aztec.js';
import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { makeExecutableSchema } from 'graphql-tools';
import {
    createNotes,
} from '~utils/note';
import {
    actionEvent,
    sendTransactionEvent,
} from '~config/event';

import { randomSumArray } from '~utils/random';
import filterStream from '~utils/filterStream';
import RegisterExtensionMutation from '../../mutations/RegisterExtension';
import RegisterAccountMutation from '../../mutations/RegisterAccount';
import ApproveDomainMutatuon from '../../mutations/ApproveDomain';
import createNoteFromBalance from './createNoteFromBalance';
import ClientConnection from '../ClientConnectionService';
import validateExtensionAccount from './utils/validateExtensionAccount';
import typeDefs from '../../../background/services/GraphQLService/typeDefs/ui';
import resolvers from '../../../background/services/GraphQLService/resolvers/ui';

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

const apollo = new ApolloClient({
    link: new SchemaLink({ schema }),
    cache: new InMemoryCache({
        addTypename: false,
    }),
    defaultOptions: {
        query: {
            fetchPolicy: 'no-cache',
        },
        watchQuery: {
            fetchPolicy: 'no-cache',
        },
    },
    connectToDevTools: true,
});

class ExtensionApi {
    constructor() {
        this.auth = {
            createKeyVault: async ({
                seedPhrase,
                address: userAddress,
                password = 'test',
                salt = 'salty',
                domain = window.location.origin,
            }) => {
                const response = await apollo.mutate({
                    mutation: RegisterExtensionMutation,
                    variables: {
                        seedPhrase,
                        address: userAddress,
                        salt,
                        password,
                        domain,
                    },
                });

                const {
                    data: {
                        registerExtension: {
                            account,
                        },
                    },
                } = response;
                return account;
            },
            linkAccountToMetaMask: async ({
                requestId,
                account,
                ...rest
            }) => {
                ClientConnection.backgroundPort.postMessage({
                    type: actionEvent,
                    requestId,
                    data: {
                        action: 'metamask.register.extension',
                        response: {
                            ...account,
                        },
                    },
                    ...rest,
                });

                return filterStream('ACTION_RESPONSE', requestId, ClientConnection.background$);
            },
            sendRegisterTransaction: async ({
                params: {
                    address: userAddress,
                    linkedPublicKey,
                    signature,
                    spendingPublicKey,
                },
                requestId,
                clientId,
            }) => {
                // we need to extract the spending public key
                ClientConnection.backgroundPort.postMessage({
                    type: sendTransactionEvent,
                    requestId,
                    clientId,
                    data: {
                        method: 'registerAZTECExtension',
                        contract: 'AZTECAccountRegistry',
                        params: [
                            userAddress,
                            linkedPublicKey,
                            spendingPublicKey,
                            signature,
                        ],
                    },
                });

                const response = await filterStream('ACTION_RESPONSE', requestId, ClientConnection.background$);
                return response;
            },
            registerAccount: async ({
                address: userAddress,
                signature,
                linkedPublicKey,
                spendingPublicKey,
                domain = window.location.origin,
            }) => {
                await apollo.mutate({
                    mutation: RegisterAccountMutation,
                    variables: {
                        address: userAddress,
                        signature,
                        linkedPublicKey,
                        spendingPublicKey,
                        domain,
                        blockNumber: 10,
                    },

                });
            },
            approveDomain: async ({
                domain,
                address: userAddress,
            }) => {
                await apollo.mutate({
                    mutation: ApproveDomainMutatuon,
                    variables: {
                        domain,
                        address: userAddress,
                    },
                });
            },

        };


        this.prove = {
            // sendTransaction,
            signNotes: async ({
                noteHashes,
                sender,
                assetAddress,
                challenge,
                requestId,
            }) => {
                ClientConnection.backgroundPort.postMessage({
                    type: actionEvent,
                    requestId,
                    data: {
                        action: 'metamask.eip712.signNotes',
                        response: {
                            noteHashes,
                            assetAddress,
                            challenge,
                            sender,
                        },
                    },
                });
                return filterStream('ACTION_RESPONSE', requestId, ClientConnection.background$);
            },
            publicApprove: async ({
                amount,
                assetAddress,
                requestId,
                proofHash,
                clientId,
            }) => {
                // get the linkedToken
                // we only call this if the user is sending the proof
                ClientConnection.backgroundPort.postMessage({
                    type: actionEvent,
                    requestId,
                    clientId,
                    data: {
                        action: 'metamask.ace.publicApprove',
                        response: {
                            amount,
                            proofHash,
                            assetAddress,
                        },
                    },
                });
                return filterStream('ACTION_RESPONSE', requestId, ClientConnection.background$);
            },
            deposit: async ({
                owner,
                transactions,
                publicOwner,
                numberOfOutputNotes,
                domain,
                currentAddress,
            }) => {
                const notesOwner = await validateExtensionAccount({
                    accountAddress: owner,
                    domain,
                    currentAddress,
                });

                const {
                    address: notesOwnerAddress,
                } = notesOwner;

                const outputTransactionNotes = await Promise.all(
                    transactions.map(async (tx) => {
                        const noteValues = randomSumArray(tx.amount, numberOfOutputNotes);
                        const {
                            spendingPublicKey,
                            linkedPublicKey,
                        } = await validateExtensionAccount({
                            accountAddress: tx.to,
                            currentAddress,
                            domain,
                        });

                        const notes = await createNotes(
                            noteValues,
                            // TODO this needs to change to the actual spending public key
                            spendingPublicKey,
                            tx.to,
                            linkedPublicKey,
                        );
                        return {
                            notes,
                            noteValues,
                        };
                    }),
                );
                const { outputNotes, outputNoteValues } = outputTransactionNotes.reduce(
                    ({ notes, values }, obj) => ({
                        outputNotes: notes.concat(obj.notes),
                        outputNoteValues: values.concat(obj.noteValues),
                    }), { notes: [], values: [] },
                );

                const {
                    JoinSplitProof,
                    ProofUtils,
                } = aztec;
                const publicValue = ProofUtils.getPublicValue(
                    [],
                    outputNoteValues,
                );
                const inputNotes = [];

                const proof = new JoinSplitProof(
                    inputNotes,
                    outputNotes,
                    notesOwnerAddress,
                    publicValue,
                    publicOwner,
                );

                return {
                    proof,
                    notes: outputNotes,
                    notesOwner,
                };
            },
            withdraw: async ({
                assetAddress,
                sender,
                to,
                amount,
                numberOfInputNotes,
                domain,
                currentAddress,
            }) => {
                const withdrawProof = await createNoteFromBalance(apollo, {
                    assetAddress,
                    sender,
                    publicOwner: to,
                    amount,
                    numberOfInputNotes,
                    numberOfOutputNotes: 0,
                    domain,
                    currentAddress,
                });
                return withdrawProof;
            },
            sendTransferProof: async ({
                requestId,
                clientId,
                params: {
                    proofData,
                    assetAddress,
                    signatures = '0x',
                },
            }) => {
                // we need to extract the spending public key
                ClientConnection.backgroundPort.postMessage({
                    type: sendTransactionEvent,
                    requestId,
                    clientId,
                    data: {
                        // TODO THIS NEEDS TO CHANGE TO BE DYNAMIC
                        contract: 'ZkAsset',
                        method: 'confidentialTransfer',
                        contractAddress: assetAddress,
                        params: [
                            proofData,
                            signatures,
                        ],
                    },
                });

                const response = await filterStream('ACTION_RESPONSE', requestId, ClientConnection.background$);
                return response;
            },

            returnToClient: async ({
                requestId,
                clientId,
            }) => {
                ClientConnection.backgroundPort.postMessage({
                    type: 'UI_RESPONSE',
                    requestId,
                    clientId,
                    data: {
                        requestId,
                        clientId,
                    },
                });
            },
        };
    }
}

export default new ExtensionApi();
