import aztec from 'aztec.js';
import {
    createNote,
    valueOf,
} from '~/utils/note';
import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ApiError from '~/client/utils/ApiError';
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

    let utilityNote = inputUtilityNote
        ? await toAztecNote(inputUtilityNote)
        : null;
    if (!utilityNote) {
        const {
            account: notesSender,
        } = await ConnectionService.query('account') || {};
        utilityNote = await createNote(
            diff,
            notesSender.spendingPublicKey,
            notesSender.address,
            notesSender.linkedPublicKey,
        );
    } else if (!(utilityNote instanceof aztec.note.Note)) {
        throw new ApiError('input.utilityNote.wrong.type', {
            note: utilityNote,
        });
    } else if (valueOf(utilityNote) !== diff) {
        throw new ApiError('input.utilityNote.wrong.value', {
            note: utilityNote,
            expectedValue: diff,
        });
    }

    const sender = customSender || Web3Service.account.address;

    const proof = new PrivateRangeProof(
        originalNote,
        comparisonNote,
        utilityNote,
        sender,
    );

    return proof;
}
