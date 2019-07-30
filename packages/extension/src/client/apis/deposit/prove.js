import aztec from 'aztec.js';
import {
    createNotes,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import address from '~utils/address';
import query from '~client/utils/query';
import ApiError from '~client/utils/ApiError';

export default async function proveDeposit({
    amount,
    from,
    sender,
    numberOfOutputNotes,
}) {
    const fromAddress = address(from);
    const senderAddress = address(from);
    if (from && !fromAddress) {
        throw new ApiError('input.address.notValid', {
            address: from,
        });
    }
    if (sender && !senderAddress) {
        throw new ApiError('input.address.notValid', {
            address: sender,
        });
    }

    const {
        user,
    } = await query(`
        user(id: "${senderAddress}") {
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
    const publicOwner = fromAddress || notesOwnerAddress;
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
