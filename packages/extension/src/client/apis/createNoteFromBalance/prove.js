import aztec from 'aztec.js';
import {
    createNote,
    createNotes,
    fromViewingKey,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import asyncMap from '~utils/asyncMap';
import query from '~client/utils/query';
import ApiError from '~client/utils/ApiError';

export default async function createNoteFromBalanceProof({
    assetAddress,
    amount,
    sender,
    owner,
    // userAccess,
    numberOfInputNotes,
    numberOfOutputNotes = 1,
}) {
    const {
        user,
    } = await query(`
        user(id: "${sender || ''}") {
            account {
                address
                linkedPublicKey
                spendingPublicKey
            }
            error {
                type
                key
                message
                response
            }
        }
    `);

    const {
        account,
    } = user || {};

    if (!account) {
        return null;
    }

    const {
        notesResponse,
    } = await query(`
        notesResponse: pickNotesFromBalance(
            assetId: "${assetAddress}",
            amount: ${amount},
            owner: "${sender}",
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
        return null;
    }

    const {
        address: senderAddress,
        linkedPublicKey,
        spendingPublicKey,
    } = account;

    let inputNotes;
    try {
        inputNotes = await asyncMap(
            notes,
            async ({ decryptedViewingKey }) => fromViewingKey(
                decryptedViewingKey,
                senderAddress,
            ),
        );
    } catch (error) {
        throw new ApiError('note.fromViewingKey', {
            notes,
        });
    }

    const publicOwner = owner || senderAddress;
    const inputValues = notes.map(({ value }) => value);
    const sum = notes.reduce((accum, { value }) => accum + value, 0);
    const extraAmount = sum - amount;
    let outputValues = [];
    let outputNotes = [];
    if (owner && numberOfOutputNotes > 0) {
        outputValues = randomSumArray(
            amount,
            extraAmount > 0 && numberOfOutputNotes > 1
                ? numberOfOutputNotes - 1
                : numberOfOutputNotes,
        );

        outputNotes = await createNotes(
            outputValues,
            spendingPublicKey,
            publicOwner,
        );
    }
    if (extraAmount > 0) {
        const remainderNote = await createNote(
            extraAmount,
            spendingPublicKey,
            senderAddress,
        );
        outputValues.push(extraAmount);
        outputNotes.push(remainderNote);
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
        senderAddress,
        publicValue,
        publicOwner,
    );

    return {
        proof,
        inputNotes,
        outputNotes,
        sender: senderAddress,
        owner: publicOwner,
        linkedPublicKey,
    };
}
