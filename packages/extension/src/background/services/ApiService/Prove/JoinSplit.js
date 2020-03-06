import {
    JoinSplitProof,
    ProofUtils,
} from 'aztec.js';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';
import {
    createNote,
    createNotes,
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
                metadata,
            }) => {
                const decryptedViewingKey = await decryptViewingKey(viewingKey);
                const note = await fromViewingKey(
                    decryptedViewingKey,
                    currentAddress,
                );
                const customData = metadata.slice(METADATA_AZTEC_DATA_LENGTH + 2);
                note.setMetaData(`0x${customData}`);
                return note;
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
        const newNotes = await createNotes(
            values,
            spendingPublicKey || currentAccount.spendingPublicKey,
            to,
            userAccessArray,
        );
        outputNotes.push(...newNotes);
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
    transactions,
    inputAmount,
    userAccess,
    numberOfInputNotes,
    numberOfOutputNotes,
}) {
    const {
        account: {
            address: currentAddress,
        },
    } = Web3Service;

    let inputNotes = [];
    let inputValues = [];
    let extraAmount = 0;
    if (inputAmount > 0 || numberOfInputNotes > 0) {
        inputNotes = await getInputNotes({
            assetAddress,
            currentAddress,
            inputAmount,
            numberOfInputNotes,
        });

        inputValues = inputNotes.map(note => valueOf(note));
        const inputNotesSum = inputValues.reduce((accum, value) => accum + value, 0);
        extraAmount = inputNotesSum - inputAmount;
    }

    const accountMapping = await getAccountMapping({
        transactions,
        currentAddress,
        userAccess,
    });

    let outputNotes = [];
    let outputValues = [];

    if (transactions && transactions.length) {
        const userAccessAccounts = !userAccess
            ? []
            : userAccess.map(address => accountMapping[address]);
        outputNotes = await getOutputNotes({
            transactions,
            numberOfOutputNotes,
            currentAddress,
            accountMapping,
            userAccessAccounts,
        });
        outputValues = outputNotes.map(note => valueOf(note));
    }

    if (extraAmount > 0) {
        const {
            spendingPublicKey,
            linkedPublicKey,
        } = accountMapping[currentAddress];
        const remainderNote = await createNote(
            extraAmount,
            spendingPublicKey,
            currentAddress,
            linkedPublicKey,
        );
        outputValues.push(extraAmount);
        outputNotes.push(remainderNote);
    }

    const publicValue = ProofUtils.getPublicValue(
        inputValues,
        outputValues,
    );

    return new JoinSplitProof(
        inputNotes,
        outputNotes,
        sender || currentAddress,
        publicValue,
        publicOwner || currentAddress,
    );
}
