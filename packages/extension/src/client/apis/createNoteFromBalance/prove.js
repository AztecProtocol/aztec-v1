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
        user(id: "${address(sender)}") {
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
        account: inputNotesOwner,
    } = user || {};

    if (!inputNotesOwner) {
        throw new ApiError('account.notLinked', {
            address: sender,
        });
    }

    let outputNotesOwner = inputNotesOwner;
    if (owner
        && address(owner) !== inputNotesOwner.address
    ) {
        const {
            user2,
        } = await query(`
            user2(id: "${address(sender)}") {
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

        ({
            account: outputNotesOwner,
        } = user2 || {});

        if (!outputNotesOwner) {
            throw new ApiError('account.notLinked', {
                address: owner,
            });
        }
    }

    const {
        notesResponse,
    } = await query(`
        notesResponse: pickNotesFromBalance(
            assetId: "${assetAddress}",
            amount: ${amount},
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
        return null;
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

    const publicOwner = outputNotesOwner.address;
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
            outputNotesOwner.spendingPublicKey,
            publicOwner,
        );
    }
    if (extraAmount > 0) {
        const remainderNote = await createNote(
            extraAmount,
            inputNotesOwner.spendingPublicKey,
            inputNotesOwner.address,
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
        inputNotesOwner.address,
        publicValue,
        publicOwner,
    );

    return {
        proof,
        inputNotes,
        inputNotesOwner,
        outputNotes,
        outputNotesOwner,
    };
}
