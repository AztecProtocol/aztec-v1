import aztec from 'aztec.js';
import {
    createNote,
    valueOf,
} from '~utils/note';
import ApiError from '~client/utils/ApiError';
import validateAccount from '../utils/validateAccount';

const {
    PrivateRangeProof,
} = aztec;

const valuesValidators = {
    eq: diff => diff === 0,
    gt: diff => diff > 0,
    gte: diff => diff >= 0,
};

const aztecNote = async (note) => {
    if (note instanceof aztec.note.Note) {
        return note;
    }
    if ('export' in note) {
        return note.export();
    }

    return null;
};

export default async function provePrivateRange({
    type = 'gt',
    originalNote: inputOriginNote,
    comparisonNote: inputComparisonNote,
    utilityNote: inputUtilityNote = null,
    sender,
}) {
    const notesSender = await validateAccount(sender, true);

    if (!inputOriginNote
        || !inputComparisonNote
    ) {
        throw new ApiError('input.note.not.defined');
    }

    const originalNote = await aztecNote(inputOriginNote);
    const comparisonNote = await aztecNote(inputComparisonNote);

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
