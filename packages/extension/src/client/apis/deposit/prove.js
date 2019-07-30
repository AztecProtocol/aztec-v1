import aztec from 'aztec.js';
import {
    createNotes,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import query from '~client/utils/query';

export default async function depositProof({
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
        address: owner,
        linkedPublicKey,
        spendingPublicKey,
    } = account;

    const noteValues = Array.isArray(amount)
        ? amount
        : randomSumArray(amount, numberOfOutputNotes);
    const notes = await createNotes(
        noteValues,
        spendingPublicKey,
        owner,
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
    const publicOwner = from || owner;
    const proof = new JoinSplitProof(
        inputNotes,
        notes,
        owner,
        publicValue,
        publicOwner,
    );

    return {
        proof,
        owner,
        linkedPublicKey,
        notes,
        noteValues,
    };
}
