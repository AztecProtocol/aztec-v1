import {
    ProofUtils,
} from 'aztec.js';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import {
    fromViewingKey,
    valueOf,
} from '~/utils/note';
import {
    randomSumArray,
} from '~/utils/random';
import asyncMap from '~/utils/asyncMap';
import asyncForEach from '~/utils/asyncForEach';
import ApiError from '~/helpers/ApiError';
import Web3Service from '~/helpers/Web3Service';
import userQuery from '~/background/services/GraphQLService/Queries/userQuery';
import pickNotesFromBalance from '~/background/services/GraphQLService/resolvers/utils/pickNotesFromBalance';
import decryptViewingKey from '~/background/services/GraphQLService/resolvers/utils/decryptViewingKey';
import settings from '~/background/utils/settings';
import query from '../utils/query';

const getInputNotes = async ({
    assetAddress,
    currentAddress,
    inputAmount,
    numberOfInputNotes,
}) => {
    let inputNotes;

    const notes = await pickNotesFromBalance({
        assetId: assetAddress,
        amount: inputAmount,
        numberOfNotes: numberOfInputNotes,
    });

    if (!notes) {
        throw new ApiError('note.pick.empty');
    }

    try {
        inputNotes = await asyncMap(
            notes,
            async ({
                viewingKey,
            }) => {
                const decryptedViewingKey = await decryptViewingKey(viewingKey);
                const note = await fromViewingKey(decryptedViewingKey);
                return {
                    noteHash: note.noteHash,
                    noteData: [
                        decryptedViewingKey,
                        currentAddress,
                    ],
                    value: valueOf(note),
                };
            },
        );
    } catch (e) {
        throw new ApiError('note.viewingKey.recover', {
            notes,
        });
    }

    return inputNotes;
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
        values.forEach(value => outputNotes.push([
            value,
            spendingPublicKey || currentAccount.spendingPublicKey,
            to,
            userAccessArray,
        ]));
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
    let extraAmount = 0;
    if (inputTransactions) {
        const inputAmount = inputTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        if (sdkPickedAmount > 0
            || sdkPickedNumberOfInputNotes > 0
            || !noteHashes // input amount might be 0
            || !noteHashes.length
        ) {
            const sdkPickedNotesData = await getInputNotes({
                assetAddress,
                currentAddress,
                inputAmount: Math.max(sdkPickedAmount, 0),
                numberOfInputNotes: sdkPickedNumberOfInputNotes > 0
                    ? sdkPickedNumberOfInputNotes
                    : null,
            });
            sdkPickedNotesData.forEach(({
                noteData,
                value,
            }) => {
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
        outputValues = outputNotes.map(noteData => noteData[0]);
    }

    if (extraAmount > 0) {
        const {
            spendingPublicKey,
            linkedPublicKey,
        } = accountMapping[currentAddress];
        outputValues.push(extraAmount);
        outputNotes.push([
            extraAmount,
            spendingPublicKey,
            currentAddress,
            linkedPublicKey,
        ]);
    }

    const publicValue = ProofUtils.getPublicValue(
        inputValues,
        outputValues,
    );

    return [
        inputNotes,
        outputNotes,
        sender || currentAddress,
        publicValue,
        publicOwner || currentAddress,
    ];
}
