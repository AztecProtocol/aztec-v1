import aztec from 'aztec.js';
import {
    createNote,
    valueOf,
} from '~utils/note';
import ApiError from '~client/utils/ApiError';
// import validateExtensionAccount from '../utils/validateExtensionAccount';
import toAztecNote from '../utils/toAztecNote';

const {
    PrivateRangeProof,
} = aztec;

const valuesValidators = {
    eq: diff => diff === 0,
    gt: diff => diff > 0,
    gte: diff => diff >= 0,
};

export default async function provePrivateRange({
    type = 'gt',
    originalNote: inputOriginNote,
    comparisonNote: inputComparisonNote,
    utilityNote: inputUtilityNote = null,
    sender,
}) {
    const notesSender = {};

    if (!inputOriginNote
        || !inputComparisonNote
    ) {
        throw new ApiError('input.note.not.defined');
    }

    const originalNote = await toAztecNote(inputOriginNote);
    const comparisonNote = await toAztecNote(inputComparisonNote);

    const diff = valueOf(originalNote) - valueOf(comparisonNote);
    const valid = valuesValidators[type](diff);
    if (!valid) {
        throw new ApiError(`input.note.not.${type}`);
    }

    let utilityNote = inputUtilityNote;
    if (!utilityNote) {
        utilityNote = await createNote(
            diff,
            notesSender.spendingPublicKey,
            notesSender.address,
            notesSender.linkedPublicKey,
        );
    }

    const proof = new PrivateRangeProof(
        originalNote,
        comparisonNote,
        utilityNote,
        notesSender.address,
    );

    return {
        proof,
        notesSender,
    };
}
