import {
    PrivateRangeProof,
} from 'aztec.js';
import {
    createNote,
    valueOf,
} from '~/utils/note';
import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ApiError from '~/client/utils/ApiError';
import toAztecNote from '../utils/toAztecNote';

const valuesValidators = {
    eq: diff => diff === 0,
    gt: diff => diff > 0,
    gte: diff => diff >= 0,
    lt: diff => diff < 0,
    lte: diff => diff <= 0,
};

export default async function provePrivateRange({
    type = 'gt',
    originalNote: inputOriginNote,
    comparisonNote: inputComparisonNote,
    remainderNote: inputRemainderNote = null,
    sender: customSender,
}) {
    if (!inputOriginNote
        || !inputComparisonNote
    ) {
        throw new ApiError('input.note.not.defined');
    }

    const originalNote = await toAztecNote(inputOriginNote);
    const comparisonNote = await toAztecNote(inputComparisonNote);

    if (!originalNote
        || !comparisonNote
    ) {
        throw new ApiError('input.note.not.valid', {
            note: !originalNote ? inputOriginNote : inputComparisonNote,
        });
    }

    const diff = valueOf(originalNote) - valueOf(comparisonNote);
    const valid = valuesValidators[type](diff);
    if (!valid) {
        throw new ApiError(`input.note.not.${type}`);
    }

    const remainderValue = Math.abs(diff);
    let remainderNote = inputRemainderNote
        ? await toAztecNote(inputRemainderNote)
        : null;
    if (inputRemainderNote && !remainderNote) {
        throw new ApiError('input.remainderNote.wrong.type', {
            note: remainderNote,
        });
    }
    if (!remainderNote) {
        const {
            account: notesSender,
        } = await ConnectionService.query('account') || {};
        remainderNote = await createNote(
            remainderValue,
            notesSender.spendingPublicKey,
            notesSender.address,
            notesSender.linkedPublicKey,
        );
    } else if (valueOf(remainderNote) !== remainderValue) {
        throw new ApiError('input.remainderNote.wrong.value', {
            note: remainderNote,
            expectedValue: remainderValue,
        });
    }

    const sender = customSender || Web3Service.account.address;
    const [largerNote, smallerNote] = diff >= 0
        ? [originalNote, comparisonNote]
        : [comparisonNote, originalNote];

    const proof = new PrivateRangeProof(
        largerNote,
        smallerNote,
        remainderNote,
        sender,
    );

    return proof;
}
