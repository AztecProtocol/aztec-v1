import aztec from 'aztec.js';
import {
    createNote,
    createNotes,
    fromViewingKey,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import address from '~utils/address';
import asyncMap from '~utils/asyncMap';
import asyncForEach from '~utils/asyncForEach';
import query from '~client/utils/query';
import ApiError from '~client/utils/ApiError';
import validateExtensionAccount from '../utils/validateExtensionAccount';
import validateAccounts from '../utils/validateAccounts';

export default async function proveCreateNoteFromBalance({
    assetAddress,
    amount,
    sender,
    owner, // will be ignore if transaction is not empty
    transaction,
    publicOwner,
    // userAccess,
    numberOfInputNotes,
    numberOfOutputNotes = 1,
}) {
    const inputNotesOwner = await validateExtensionAccount(sender);
    let inputAmount = amount;

    const outputNotesOwnerMapping = {};
    let outputNotesOwner = inputNotesOwner;
    let transactions;
    if (transaction) {
        transactions = Array.isArray(transaction)
            ? transaction
            : [transaction];

        const userAddresses = transactions.map(t => t.to);
        const notesOwners = await validateAccounts(userAddresses);
        notesOwners.forEach((o) => {
            outputNotesOwnerMapping[o.address] = o;
        });

        inputAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        if (amount && inputAmount !== amount) {
            throw new ApiError('input.amount.not.match.transaction');
        }
    } else if (owner) {
        if (address(owner) !== inputNotesOwner.address) {
            outputNotesOwner = await validateAccounts(owner);
        }
        outputNotesOwnerMapping[outputNotesOwner.address] = outputNotesOwner;
    }

    const {
        notesResponse,
    } = await query(`
        notesResponse: pickNotesFromBalance(
            assetId: "${assetAddress}",
            amount: ${inputAmount},
            owner: "${inputNotesOwner.address}",
            numberOfNotes: ${numberOfInputNotes || 0}
        ) {
            notes {
                value
                decryptedViewingKey
                hash
                status
            }
            error {
                type
                key
                message
                response
            }
        }
    `) || {};

    const {
        notes,
    } = notesResponse || {};

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
    } catch (error) {
        throw new ApiError('note.fromViewingKey', {
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
            const notesOwner = outputNotesOwnerMapping[address(to)];
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
        inputNotes,
        inputNotesOwner,
        outputNotes,
        outputNotesOwner,
        outputNotesOwnerMapping,
    };
}
