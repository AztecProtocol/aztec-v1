import ensureInputNotes from '../utils/ensureInputNotes';
import validateExtensionAccount from '../utils/validateExtensionAccount';
import validateAccounts from '../utils/validateAccounts';

export default async function verifyWithdrawRequest({
    assetAddress,
    amount,
    sender,
    to,
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

    const senderError = await validateExtensionAccount(sender);
    if (senderError) {
        return senderError;
    }

    const invalidAddressError = await validateAccounts([to]);
    if (invalidAddressError) {
        return invalidAddressError;
    }

    return null;
}
