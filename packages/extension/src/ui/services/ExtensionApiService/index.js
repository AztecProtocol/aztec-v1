import ApolloClient from 'apollo-client';
import aztec from 'aztec.js';
import { proofs } from '@aztec/dev-utils';
import { SchemaLink } from 'apollo-link-schema';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { makeExecutableSchema } from 'graphql-tools';
import {
    createNote,
    createNotes,
    fromViewingKey,
    valueOf,
} from '~utils/note';
import {
    actionEvent,
    sendTransactionEvent,
} from '~config/event';
import ApiError from '~client/utils/ApiError';
import { randomSumArray } from '~utils/random';
import filterStream from '~utils/filterStream';
import RegisterExtensionMutation from '../../mutations/RegisterExtension';
import RegisterAccountMutation from '../../mutations/RegisterAccount';
import Web3Service from '~client/services/Web3Service';
import ContractError from '~client/utils/ContractError';
import UtilityNoteQuery from '../../queries/UtilityNoteQuery';
import ApproveDomainMutatuon from '../../mutations/ApproveDomain';
import createNoteFromBalance from './createNoteFromBalance';
import ClientConnection from '../ClientConnectionService';
import validateExtensionAccount from './utils/validateExtensionAccount';
import typeDefs from '../../../background/services/GraphQLService/typeDefs/ui';
import resolvers from '../../../background/services/GraphQLService/resolvers/ui';
import ACE from '../../../../build/protocol/ACE.json';

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
            transfer: async ({
                assetAddress,
                sender,
                transactions,
                numberOfInputNotes,
                domain,
                currentAddress,
            }) => {
                const transferProof = await createNoteFromBalance(apollo, {
                    assetAddress,
                    sender,
                    transactions,
                    numberOfInputNotes,
                    numberOfOutputNotes: 0,
                    domain,
                    currentAddress,
                });
                return transferProof;
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
            mint: async ({
                assetAddress,
                transactions,
                numberOfOutputNotes,
                sender,
                currentAddress,
                domain,
            }) => {
                // TODO this will eventually be passed in from the config
                await Web3Service.init({
                    provider: 'http://localhost:8545',
                });
                Web3Service.registerContract(ACE);
                const notesOwner = await validateExtensionAccount({
                    accountAddress: currentAddress,
                    domain,
                    currentAddress,
                });

                let confidentialTotalMinted;
                const {
                    MintProof,
                    ProofUtils,
                } = aztec;

                let confidentialTotalMintedHash;
                try {
                    ({
                        confidentialTotalMinted: confidentialTotalMintedHash,
                    } = await Web3Service
                        .useContract('ACE')
                        .method('getRegistry')
                        .call(assetAddress));
                } catch (error) {
                    throw new ContractError('ace.getRegistry', {
                        messageOptions: {
                            asset: assetAddress,
                        },
                        error,
                    });
                }

                let balance;
                let oldMintCounterNote;
                const zeroNote = await aztec.note.createZeroValueNote();
                if (confidentialTotalMintedHash === zeroNote.noteHash) {
                    balance = 0;
                    oldMintCounterNote = zeroNote;
                } else {
                    const {
                        data: { utilityNote },
                    } = await apollo.query({
                        query: UtilityNoteQuery,
                        variables: {
                            id: confidentialTotalMintedHash,
                        },
                    });

                    const {
                        note,
                    } = utilityNote || {};
                    if (!note) {
                        throw new ApiError('api.mint.totalMinted.not.found');
                    }

                    const {
                        decryptedViewingKey,
                    } = note;
                    if (!decryptedViewingKey) {
                        throw new ApiError('api.mint.totalMinted.not.valid');
                    }

                    oldMintCounterNote = await fromViewingKey(decryptedViewingKey);
                    balance = valueOf(oldMintCounterNote);
                }

                const amount = transactions.reduce((accum, tx) => accum + tx.amount, 0);

                const {
                    address: ownerAddress,
                    linkedPublicKey,
                    spendingPublicKey,
                } = notesOwner;

                const newMintCounterNote = await createNote(
                    balance + amount,
                    spendingPublicKey,
                    ownerAddress,
                    linkedPublicKey,
                );
                // this needs to be an array
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

                const proof = new MintProof(
                    oldMintCounterNote,
                    newMintCounterNote,
                    outputNotes,
                    sender,
                );

                return {
                    proof,
                    notesOwner,
                    outputNotes,
                };
            },
            sendMintProof: async ({
                requestId,
                clientId,
                params: {
                    proofData,
                    assetAddress,
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
                        method: 'confidentialMint',
                        contractAddress: assetAddress,
                        params: [
                            proofs.MINT_PROOF,
                            proofData,
                        ],
                    },
                });

                const response = await filterStream('ACTION_RESPONSE', requestId, ClientConnection.background$);
                return response;
            },
            burn: async ({
                assetAddress,
                notes,
                sender,
                currentAddress,
                domain,
            }) => {
                // 1. we need to fetch all the utility notes
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
