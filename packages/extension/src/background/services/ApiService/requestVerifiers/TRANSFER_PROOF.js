import ensureInputNotes from '../utils/ensureInputNotes';
import validateExtensionAccount from '../utils/validateExtensionAccount';
import validateAccounts from '../utils/validateAccounts';

export default async function verifyTransferRequest({
    assetAddress,
    sender,
    transactions,
    numberOfInputNotes,
}) {
    const totalAmount = transactions
        .reduce((sum, { amount }) => sum + amount, 0);

    const noteError = await ensureInputNotes({
        assetAddress,
        numberOfInputNotes,
        amount: totalAmount,
    });
    if (noteError) {
        return noteError;
    }

    const senderError = await validateExtensionAccount(sender);
    if (senderError) {
        return senderError;
    }

    const addresses = transactions.map(({ to }) => to);
    const invalidAddressError = await validateAccounts(addresses);
    if (invalidAddressError) {
        return invalidAddressError;
    }

    return null;
}
