import {
    warnLogProduction,
} from '~/utils/log';
import {
    argsError,
} from '~/utils/error';
import validateAccounts from './utils/validateAccounts';
import ensureInputNotes from './utils/ensureInputNotes';
import validateNoteHashes from './utils/validateNoteHashes';

export default async function verifyWithdrawRequest({
    assetAddress,
    amount,
    to,
    numberOfInputNotes,
    inputNoteHashes,
    returnProof,
    sender,
}) {
    if (sender && !returnProof) {
        warnLogProduction(argsError('input.returnProof.only', {
            args: 'sender',
        }));
    }

    const noteError = await ensureInputNotes({
        assetAddress,
        numberOfInputNotes,
        amount,
    });
    if (noteError) {
        return noteError;
    }

    if (inputNoteHashes) {
        const noteHashError = validateNoteHashes(inputNoteHashes, {
            assetAddress,
            amount,
            numberOfInputNotes,
        });
        if (noteHashError) {
            return noteHashError;
        }
    }

    const invalidAddressError = await validateAccounts([to]);
    if (invalidAddressError) {
        return invalidAddressError;
    }

    return null;
}
