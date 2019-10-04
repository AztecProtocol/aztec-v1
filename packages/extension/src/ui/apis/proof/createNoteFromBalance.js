import aztec from 'aztec.js';
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
    defaultInt,
} from '~ui/config/settings';
import ConnectionService from '~ui/services/ConnectionService';
import {
    getNoteOwnerAccount,
} from '~ui/apis/account';

export default async function createNoteFromBalance({
    assetAddress,
    amount,
    sender,
    owner, // will be ignore if transaction is not empty
    transactions,
    publicOwner,
    // userAccess,
    numberOfInputNotes: customNumberOfInputNotes,
    numberOfOutputNotes: customNumberOfOutputNotes,
}) {
    const inputNotesOwner = await getNoteOwnerAccount(sender);
    let inputAmount = amount;

    const numberOfInputNotes = customNumberOfInputNotes !== defaultInt
        ? customNumberOfInputNotes
        : await settings('NUMBER_OF_INPUT_NOTES');
    const numberOfOutputNotes = customNumberOfOutputNotes !== defaultInt
        ? customNumberOfOutputNotes
        : await settings('NUMBER_OF_OUTPUT_NOTES');

    const outputNotesOwnerMapping = {};
    let outputNotesOwner = inputNotesOwner;
    if (transactions && transactions.length) {
        await asyncForEach(transactions, async ({ to }) => {
            const account = await getNoteOwnerAccount(to);
            outputNotesOwnerMapping[to] = account;
        });

        inputAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        if (amount && inputAmount !== amount) {
            errorLog(`Input amount (${amount}) does not match total transactions (${inputAmount}).`);
        }
    } else if (owner) {
        if (owner !== inputNotesOwner.address) {
            outputNotesOwner = await getNoteOwnerAccount(owner);
        }
        outputNotesOwnerMapping[outputNotesOwner.address] = outputNotesOwner;
    }

    const {
        pickNotesFromBalance,
    } = await ConnectionService.query({
        query: 'asset.pickNotesFromBalance',
        data: {
            assetId: assetAddress,
            amount: inputAmount,
            owner: inputNotesOwner.address,
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
            async ({ decryptedViewingKey }) => fromViewingKey(
                decryptedViewingKey,
                inputNotesOwner.address,
            ),
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
    if (extraAmount > 0) {
        const remainderNote = await createNote(
            extraAmount,
            inputNotesOwner.spendingPublicKey,
            inputNotesOwner.address,
            inputNotesOwner.linkedPublicKey,
        );
        outputValues.push(extraAmount);
        outputNotes.push(remainderNote);
        outputNotesOwnerMapping[inputNotesOwner.address] = inputNotesOwner;
    }

    if (transactions) {
        await asyncForEach(transactions, async ({
            amount: transactionAmount,
            to,
            numberOfOutputNotes: count,
        }) => {
            const notesOwner = outputNotesOwnerMapping[to];
            const values = randomSumArray(
                transactionAmount,
                count || numberOfOutputNotes,
            );
            outputValues.push(...values);
            const newNotes = await createNotes(
                values,
                inputNotesOwner.spendingPublicKey,
                notesOwner.address,
                notesOwner.linkedPublicKey,
            );
            outputNotes.push(...newNotes);
        });
    } else if (numberOfOutputNotes > 0) {
        const values = randomSumArray(
            inputAmount,
            numberOfOutputNotes,
        );
        outputValues.push(...values);

        const newNotes = await createNotes(
            values,
            inputNotesOwner.spendingPublicKey,
            outputNotesOwner.address,
            outputNotesOwner.linkedPublicKey,
        );
        outputNotes.push(...newNotes);
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
        inputNotesOwner.address,
        publicValue,
        publicOwner || inputNotesOwner.address,
    );

    return {
        proof,
    };
}
