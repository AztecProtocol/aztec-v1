import ensureInputNotes from '../utils/ensureInputNotes';
import validateAccounts from '../utils/validateAccounts';

export default async function verifyCreateNoteFromBalanceRequest({
    assetAddress,
    amount,
    owner,
    numberOfInputNotes,
}) {
    const noteError = await ensureInputNotes({
        assetAddress,
        numberOfInputNotes,
        amount,
    });
    if (noteError) {
        return noteError;
    }

    const ownerError = await validateAccounts({
        addresses: [owner],
    });
    if (ownerError) {
        return ownerError;
    }

    return null;
}
