import ensureInputNotes from '../utils/ensureInputNotes';
import validateAccounts from '../utils/validateAccounts';

export default async function verifyCreateNoteFromBalanceRequest({
    assetAddress,
    amount,
    numberOfInputNotes,
    userAccess,
}) {
    const noteError = await ensureInputNotes({
        assetAddress,
        numberOfInputNotes,
        amount,
    });
    if (noteError) {
        return noteError;
    }

    if (userAccess && userAccess.length > 0) {
        const invalidAddressError = await validateAccounts(userAccess);
        if (invalidAddressError) {
            return invalidAddressError;
        }
    }

    return null;
}
