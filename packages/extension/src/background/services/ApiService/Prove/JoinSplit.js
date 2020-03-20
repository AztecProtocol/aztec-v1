import {
    ProofUtils,
} from 'aztec.js';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';
import {
    randomSumArray,
} from '~/utils/random';
import {
    createNote,
    createNotes,
} from '~/utils/note';
import {
    aztecNoteToData,
} from '~/utils/transformData';
import asyncForEach from '~/utils/asyncForEach';
import ApiError from '~/helpers/ApiError';
import Web3Service from '~/helpers/Web3Service';
import GraphQLService from '~/background/services/GraphQLService';
import notesQuery from '~/background/services/GraphQLService/Queries/notesQuery';
import userQuery from '~/background/services/GraphQLService/Queries/userQuery';
import pickNotesFromBalanceQuery from '~/background/services/GraphQLService/Queries/pickNotesFromBalanceQuery';
import settings from '~/background/utils/settings';
import query from '../utils/query';

const inputNoteToData = ({
    noteHash,
    decryptedViewingKey,
    metadata,
    value,
    owner,
}) => {
    const customData = (metadata || '').slice(METADATA_AZTEC_DATA_LENGTH + 2);
    return {
        noteHash,
        decryptedViewingKey,
        metadata: customData ? `0x${customData}` : '',
        value,
        owner,
    };
};

const getExistingNotes = async ({
    noteHashes,
    currentAddress,
}) => {
    const {
        data: {
            notes: {
                notes,
            },
        },
    } = await GraphQLService.query({
        query: notesQuery(`
            noteHash
            decryptedViewingKey
            metadata
            value
        `),
        variables: {
            where: {
                noteHash_in: noteHashes,
            },
        },
    }) || {};

    return notes.map(note => inputNoteToData({
        ...note,
        owner: currentAddress,
    }));
};

const getInputNotes = async ({
    assetAddress,
    currentAddress,
    inputAmount,
    numberOfInputNotes,
    excludedNotes = [],
}) => {
    const {
        data: {
            pickNotesFromBalance: {
                notes,
                error,
            },
        },
    } = await GraphQLService.query({
        query: pickNotesFromBalanceQuery(`
            noteHash,
            decryptedViewingKey
            value
            metadata
        `),
        variables: {
            assetId: assetAddress,
            amount: inputAmount,
            owner: currentAddress,
            numberOfNotes: numberOfInputNotes,
            excludedNotes,
        },
    }) || {};

    if (!notes) {
        if (error) {
            throw error;
        }
        throw new ApiError('note.pick.empty');
    }

    return notes.map(note => inputNoteToData({
        ...note,
        owner: currentAddress,
    }));
};

const getOutputNotes = async ({
    transactions,
    numberOfOutputNotes,
    currentAddress,
    accountMapping,
    userAccessAccounts,
}) => {
    const outputNotes = [];
    const currentAccount = accountMapping[currentAddress];
    await asyncForEach(transactions, async ({
        amount,
        to,
        numberOfOutputNotes: count,
    }) => {
        if (!count && !numberOfOutputNotes) return;

        const values = randomSumArray(
            amount,
            count || numberOfOutputNotes,
        );
        const {
            linkedPublicKey,
            spendingPublicKey,
        } = accountMapping[to] || {};
        const ownerAccess = !linkedPublicKey
            ? null
            : {
                address: to,
                linkedPublicKey,
            };
        const userAccessArray = !userAccessAccounts.length
            ? ownerAccess
            : uniqBy(
                [
                    ...userAccessAccounts,
                    ownerAccess,
                ],
                'address',
            ).filter(a => a);
        const notes = await createNotes(
            values,
            spendingPublicKey || currentAccount.spendingPublicKey,
            to,
            userAccessArray,
        );
        notes.forEach((note) => {
            outputNotes.push(aztecNoteToData(note));
        });
    });

    return outputNotes;
};

const getAccountMapping = async ({
    transactions,
    currentAddress,
    userAccess,
}) => {
    const accountMapping = {};

    let addresses = (transactions || []).map(({ to }) => to);
    addresses.push(currentAddress);
    if (userAccess) {
        addresses.push(...userAccess);
    }
    addresses = uniq(addresses);

    const accounts = [];
    await Promise.all(addresses.map(async (address) => {
        const request = {
            domain: window.location.origin,
            data: {
                args: {
                    id: address,
                },
            },
        };
        const {
            user: {
                account,
                error,
            },
        } = await query(request, userQuery(`
            address
            linkedPublicKey
            spendingPublicKey
        `));
        if (account && !error) {
            accounts.push(account);
        }
    }));

    accounts.forEach((account) => {
        accountMapping[account.address] = account;
    });

    return accountMapping;
};

export default async function JoinSplit({
    assetAddress,
    sender,
    publicOwner,
    inputTransactions,
    outputTransactions,
    inputNoteHashes,
    numberOfInputNotes,
    numberOfOutputNotes: customNumberOfOutputNotes,
    userAccess,
}) {
    const {
        account: {
            address: currentAddress,
        },
    } = Web3Service;

    const inputNotes = [];
    const inputValues = [];
    let userPickedNotesData = [];
    let extraAmount = 0;
    if (inputTransactions) {
        const inputAmount = inputTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        let sdkPickedAmount = inputAmount;
        let sdkPickedNumberOfInputNotes = numberOfInputNotes || 0;

        if (inputNoteHashes && inputNoteHashes.length) {
            userPickedNotesData = await getExistingNotes({
                noteHashes: inputNoteHashes,
                currentAddress,
            });
            userPickedNotesData.forEach((noteData) => {
                const { value } = noteData;
                inputNotes.push(noteData);
                inputValues.push(value);
                sdkPickedAmount -= value;
            });

            sdkPickedNumberOfInputNotes -= inputNoteHashes.length;
        }

        if (sdkPickedAmount > 0
            || sdkPickedNumberOfInputNotes > 0
            || !inputNoteHashes // input amount might be 0
            || !inputNoteHashes.length
        ) {
            const sdkPickedNotesData = await getInputNotes({
                assetAddress,
                currentAddress,
                inputAmount: Math.max(sdkPickedAmount, 0),
                numberOfInputNotes: sdkPickedNumberOfInputNotes > 0
                    ? sdkPickedNumberOfInputNotes
                    : null,
                excludedNotes: userPickedNotesData.map(({
                    noteHash,
                    value,
                }) => ({
                    noteHash,
                    value,
                })),
            });
            sdkPickedNotesData.forEach((noteData) => {
                const { value } = noteData;
                inputNotes.push(noteData);
                inputValues.push(value);
            });
        }

        const inputNotesSum = inputValues.reduce((accum, value) => accum + value, 0);
        extraAmount = inputNotesSum - inputAmount;
    }

    const accountMapping = await getAccountMapping({
        transactions: outputTransactions,
        currentAddress,
        userAccess,
    });

    let outputNotes = [];
    let outputValues = [];

    if (outputTransactions) {
        const numberOfOutputNotes = customNumberOfOutputNotes > 0
            ? customNumberOfOutputNotes
            : await settings('NUMBER_OF_OUTPUT_NOTES');
        const userAccessAccounts = !userAccess
            ? []
            : userAccess.map(address => accountMapping[address]);
        outputNotes = await getOutputNotes({
            transactions: outputTransactions,
            numberOfOutputNotes,
            currentAddress,
            accountMapping,
            userAccessAccounts,
        });
        outputValues = outputNotes.map(({ value }) => value);
    }

    let remainderNote;
    if (extraAmount > 0) {
        const {
            spendingPublicKey,
            linkedPublicKey,
        } = accountMapping[currentAddress];
        const note = await createNote(
            extraAmount,
            spendingPublicKey,
            currentAddress,
            linkedPublicKey,
        );
        remainderNote = aztecNoteToData(note);
        outputValues.push(extraAmount);
        outputNotes.push(remainderNote);
    }

    const publicValue = ProofUtils.getPublicValue(
        inputValues,
        outputValues,
    );

    return {
        inputNotes,
        outputNotes,
        sender: sender || currentAddress,
        publicValue,
        publicOwner: publicOwner || currentAddress,
        remainderNote,
    };
}
