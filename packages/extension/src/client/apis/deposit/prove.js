import aztec from 'aztec.js';
import {
    createNotes,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import query from '~client/utils/query';

export default async function proveDeposit({
    amount,
    from,
    sender,
    numberOfOutputNotes,
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
        address: notesOwnerAddress,
        linkedPublicKey,
        spendingPublicKey,
    } = account;

    const noteValues = Array.isArray(amount)
        ? amount
        : randomSumArray(amount, numberOfOutputNotes);
    const notes = await createNotes(
        noteValues,
        spendingPublicKey,
        notesOwnerAddress,
    );
    const {
        JoinSplitProof,
        ProofUtils,
    } = aztec;
    const publicValue = ProofUtils.getPublicValue(
        [],
        noteValues,
    );
    const inputNotes = [];
    const publicOwner = from || notesOwnerAddress;
    const proof = new JoinSplitProof(
        inputNotes,
        notes,
        notesOwnerAddress,
        publicValue,
        publicOwner,
    );

    return {
        proof,
        notes,
        notesOwner: {
            address: notesOwnerAddress,
            linkedPublicKey,
        },
        noteValues,
    };
}
