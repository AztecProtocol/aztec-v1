import {
    warnLogProduction,
} from '~/utils/log';
import {
    argsError,
} from '~/utils/error';
import validateAccounts from './utils/validateAccounts';
import ensureInputNotes from './utils/ensureInputNotes';

export default async function verifyTransferRequest({
    assetAddress,
    transactions,
    numberOfInputNotes,
    userAccess,
    returnProof,
    sender,
    publicOwner,
}) {
    if ((sender || publicOwner) && !returnProof) {
        const invalidArgs = [];
        if (sender) {
            invalidArgs.push('sender');
        }
        if (publicOwner) {
            invalidArgs.push('publicOwner');
        }
        warnLogProduction(argsError('input.returnProof.only', {
            args: invalidArgs.join(', '),
        }));
    }

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

    const addresses = transactions
        .filter(({ aztecAccountNotRequired }) => !aztecAccountNotRequired)
        .map(({ to }) => to);

    if (addresses.length !== transactions.length
        && (!userAccess || !userAccess.length)
    ) {
        return argsError('note.viewingKey.noAccess');
    }

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
