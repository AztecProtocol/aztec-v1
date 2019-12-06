import aztec from 'aztec.js';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~config/constants';
import {
    errorLog,
} from '~utils/log';
import {
    createNote,
    createNotes,
    fromViewingKey,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import asyncMap from '~utils/asyncMap';
import asyncForEach from '~utils/asyncForEach';
import ApiError from '~/helpers/ApiError';
import settings from '~background/utils/settings';
import {
    emptyIntValue,
} from '~ui/config/settings';
import ConnectionService from '~ui/services/ConnectionService';
import {
    getExtensionAccount,
} from '~ui/apis/account';

export default async function createNoteFromBalance({
    assetAddress,
    currentAddress,
    sender,
    amount,
    transactions,
    publicOwner,
    // userAccess,
    numberOfInputNotes: customNumberOfInputNotes,
    numberOfOutputNotes: customNumberOfOutputNotes,
}) {
    const inputNotesOwner = await getExtensionAccount(currentAddress);
    let inputAmount = amount;

    const numberOfInputNotes = !Object.is(customNumberOfInputNotes, emptyIntValue)
        ? customNumberOfInputNotes
        : await settings('NUMBER_OF_INPUT_NOTES');
    const numberOfOutputNotes = !Object.is(customNumberOfOutputNotes, emptyIntValue)
        ? customNumberOfOutputNotes
        : await settings('NUMBER_OF_OUTPUT_NOTES');

    const outputNotesOwnerMapping = {
        [currentAddress]: inputNotesOwner,
    };
    if (transactions && transactions.length) {
        inputAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        if (amount && inputAmount !== amount) {
            errorLog(`Input amount (${amount}) does not match total transactions (${inputAmount}).`);
        }

        const newAddresses = transactions
            .map(({ to }) => to)
            .filter(addr => addr !== currentAddress)
            .filter((addr, idx, arr) => arr.indexOf(addr) === idx);
        await Promise.all(newAddresses.map(async (addr) => {
            outputNotesOwnerMapping[addr] = await getExtensionAccount(addr);
        }));
    }

    const {
        pickNotesFromBalance,
    } = await ConnectionService.query({
        query: 'asset.pickNotesFromBalance',
        data: {
            assetId: assetAddress,
            amount: inputAmount,
            owner: currentAddress,
            numberOfNotes: numberOfInputNotes,
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

    const outputValues = [];
    const outputNotes = [];
    const inputValues = notes.map(({ value }) => value);
    const sum = notes.reduce((accum, { value }) => accum + value, 0);
    const extraAmount = sum - inputAmount;
    let remainderNote;
    if (extraAmount > 0) {
        remainderNote = await createNote(
            extraAmount,
            inputNotesOwner.spendingPublicKey,
            inputNotesOwner.address,
            inputNotesOwner.linkedPublicKey,
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
            const notesOwner = outputNotesOwnerMapping[to];
            outputValues.push(...values);
            const newNotes = await createNotes(
                values,
                notesOwner.spendingPublicKey,
                notesOwner.address,
                notesOwner.linkedPublicKey,
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

    return {
        proof,
        inputNotes,
        outputNotes,
        remainderNote,
    };
}
