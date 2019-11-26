import {
    argsError,
} from '~utils/error';
import fetchAztecAccount from './fetchAztecAccount';

export default async function getAccounts(args, ctx = {}) {
    const {
        where: {
            address_in: addresses,
            // TODO
            // should support more filters
        },
    } = args;

    const {
        networkId,
    } = ctx;

    let accounts = await Promise.all(addresses.map(address => fetchAztecAccount({
        address,
        networkId,
    })));

    accounts = accounts
        .map(({ account }) => account)
        .filter(a => a);
    const onChainAccounts = accounts || [];
    const invalidAccounts = addresses
        .filter((addr) => {
            const account = onChainAccounts.find(a => a.address === addr);
            return !account || !account.linkedPublicKey;
        });

    if (invalidAccounts.length > 0) {
        throw argsError('account.not.linked', {
            invalidAccounts,
        });
    }

    accounts = accounts.map(({
        address,
        linkedPublicKey,
        spendingPublicKey,
    }) => ({
        id: address,
        address,
        linkedPublicKey,
        spendingPublicKey,
    }));

    return accounts;
}
