import ensureInputNotes from '../utils/ensureInputNotes';
import validateAccounts from '../utils/validateAccounts';

export default async function verifyTransferRequest({
    assetAddress,
    transactions,
    numberOfInputNotes,
    userAccess,
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

    const addresses = transactions.map(({ to }) => to);
    if (userAccess && userAccess.length > 0) {
        userAccess.forEach((address) => {
            if (addresses.indexOf(address) < 0) {
                addresses.push(address);
            }
        });
    }
    const invalidAddressError = await validateAccounts(addresses);
    if (invalidAddressError) {
        return invalidAddressError;
    }

    return null;
}
