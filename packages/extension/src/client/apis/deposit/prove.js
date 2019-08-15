import aztec from 'aztec.js';
import {
    createNotes,
} from '~utils/note';
import {
    randomSumArray,
} from '~utils/random';
import address from '~utils/address';
import ApiError from '~client/utils/ApiError';
import validateExtensionAccount from '../utils/validateExtensionAccount';

const {
    JoinSplitProof,
    ProofUtils,
} = aztec;

export default async function proveDeposit({
    amount,
    from,
    sender,
    numberOfOutputNotes,
}) {
    const fromAddress = address(from);
    if (from && !fromAddress) {
        throw new ApiError('input.address.notValid', {
            address: from,
        });
    }

    const notesOwner = await validateExtensionAccount(sender);
    const {
        address: notesOwnerAddress,
        spendingPublicKey,
        linkedPublicKey,
    } = notesOwner;

    const noteValues = Array.isArray(amount)
        ? amount
        : randomSumArray(amount, numberOfOutputNotes);
    const notes = await createNotes(
        noteValues,
        spendingPublicKey,
        notesOwnerAddress,
        linkedPublicKey,
    );

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
        notesOwner,
        noteValues,
    };
}
