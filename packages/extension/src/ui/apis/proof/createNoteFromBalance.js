import * as aztec from 'aztec.js';
import { keccak256 } from 'web3-utils';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';
import {
    errorLog,
} from '~/utils/log';
import {
    createNote,
    createNotes,
    fromViewingKey,
} from '~/utils/note';
import {
    randomSumArray,
} from '~/utils/random';
import asyncMap from '~/utils/asyncMap';
import asyncForEach from '~/utils/asyncForEach';
import ApiError from '~/helpers/ApiError';
import settings from '~/background/utils/settings';
import {
    emptyIntValue,
} from '~/ui/config/settings';
import ConnectionService from '~/ui/services/ConnectionService';
import {
    batchGetExtensionAccount,
} from '~/ui/apis/account';

export default async function createNoteFromBalance({
    assetAddress,
    currentAddress,
    sender,
    amount,
    transactions,
    publicOwner,
    userAccessAccounts,
    numberOfInputNotes: customNumberOfInputNotes,
    numberOfOutputNotes: customNumberOfOutputNotes,
}) {
    let inputAmount = amount;
    if (transactions && transactions.length) {
        inputAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        if (amount && inputAmount !== amount) {
            errorLog(`Input amount (${amount}) does not match total transactions (${inputAmount}).`);
        }
    }

    const numberOfInputNotes = !Object.is(customNumberOfInputNotes, emptyIntValue)
        ? customNumberOfInputNotes
        : await settings('NUMBER_OF_INPUT_NOTES');

    const numberOfOutputNotes = !Object.is(customNumberOfOutputNotes, emptyIntValue)
        ? customNumberOfOutputNotes
        : await settings('NUMBER_OF_OUTPUT_NOTES');

    const {
        pickNotesFromBalance,
    } = await ConnectionService.query({
        query: 'pickNotesFromBalance',
        data: {
            assetId: assetAddress,
            amount: inputAmount,
            owner: currentAddress,
            numberOfNotes: numberOfInputNotes,
            requestedFields: `
                value
                decryptedViewingKey
                noteHash
                metadata
                status
            `,
        },
    });

    const {
        notes,
        error,
    } = pickNotesFromBalance || {};

    if (error) {
        throw new ApiError({ error });
    }

    if (!notes) {
        throw new ApiError('note.pick.empty');
    }

    let inputNotes;
    try {
        inputNotes = await asyncMap(
            notes,
            async ({
                decryptedViewingKey,
                metadata,
            }) => {
                const note = await fromViewingKey(
                    decryptedViewingKey,
                    currentAddress,
                );
                const customData = metadata.slice(METADATA_AZTEC_DATA_LENGTH + 2);
                note.setMetaData(`0x${customData}`);
                return note;
            },
        );
    } catch {
        throw new ApiError('note.viewingKey.recover', {
            notes,
        });
    }

    const inputValues = notes.map(({ value }) => value);
    const sum = notes.reduce((accum, { value }) => accum + value, 0);
    const extraAmount = sum - inputAmount;

    const addresses = (transactions || []).map(({ to }) => to);
    if (extraAmount > 0) {
        addresses.push(currentAddress);
    }
    const accountMapping = {};
    const accounts = await batchGetExtensionAccount(addresses);
    accounts.forEach((account) => {
        accountMapping[account.address] = account;
    });

    const outputValues = [];
    const outputNotes = [];
    let remainderNote;
    if (extraAmount > 0) {
        const {
            spendingPublicKey,
            linkedPublicKey,
        } = accountMapping[currentAddress];
        remainderNote = await createNote(
            extraAmount,
            spendingPublicKey,
            currentAddress,
            linkedPublicKey,
        );
        outputValues.push(extraAmount);
        outputNotes.push(remainderNote);
    }

    if (transactions) {
        await asyncForEach(transactions, async ({
            amount: transactionAmount,
            to,
            numberOfOutputNotes: count,
        }) => {
            if (!count && !numberOfOutputNotes) return;

            const values = randomSumArray(
                transactionAmount,
                count || numberOfOutputNotes,
            );
            const {
                linkedPublicKey,
                spendingPublicKey,
            } = accountMapping[to];
            outputValues.push(...values);
            const ownerAccess = {
                address: to,
                linkedPublicKey,
            };
            const userAccess = !userAccessAccounts
                ? ownerAccess
                : [
                    ...userAccessAccounts,
                    ownerAccess,
                ].filter((access, i, arr) => i === arr.findIndex(({
                    address,
                }) => address === access.address));
            const newNotes = await createNotes(
                values,
                spendingPublicKey,
                to,
                userAccess,
            );
            outputNotes.push(...newNotes);
        });
    }

    const {
        JoinSplitProof,
        ProofUtils,
    } = aztec;
    const publicValue = ProofUtils.getPublicValue(
        inputValues,
        outputValues,
    );

    const proof = new JoinSplitProof(
        inputNotes,
        outputNotes,
        sender,
        publicValue,
        publicOwner,
    );

    const proofHash = keccak256(proof.eth.outputs);

    return {
        proof,
        proofHash,
        inputNotes,
        outputNotes,
        remainderNote,
    };
}
