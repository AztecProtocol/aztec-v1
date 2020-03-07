import {
    PrivateRangeProof,
    note as noteUtils,
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

    let remainderNote = inputRemainderNote
        ? await toAztecNote(inputRemainderNote)
        : null;
    if (!remainderNote) {
        const {
            account: notesSender,
        } = await ConnectionService.query('account') || {};
        remainderNote = await createNote(
            diff,
            notesSender.spendingPublicKey,
            notesSender.address,
            notesSender.linkedPublicKey,
        );
    } else if (!(remainderNote instanceof noteUtils.Note)) {
        throw new ApiError('input.remainderNote.wrong.type', {
            note: remainderNote,
        });
    } else if (valueOf(remainderNote) !== diff) {
        throw new ApiError('input.remainderNote.wrong.value', {
            note: remainderNote,
            expectedValue: diff,
        });
    }

    const sender = customSender || Web3Service.account.address;

    const proof = new PrivateRangeProof(
        originalNote,
        comparisonNote,
        remainderNote,
        sender,
    );

    return proof;
}
