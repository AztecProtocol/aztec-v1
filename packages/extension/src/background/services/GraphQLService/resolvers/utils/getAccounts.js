import {
    argsError,
} from '~/utils/error';
import fetchAztecAccount from './fetchAztecAccount';

export default async function getAccounts(args) {
    const {
        where: {
            address_in: addresses,
            // TODO
            // should support more filters
        },
    } = args;

    let accounts = await Promise.all(addresses.map(address => fetchAztecAccount({
        address,
    })));

    accounts = accounts
        .map(({ account }) => account)
        .filter(a => a);
    const onChainAccounts = accounts || [];
    const invalidAddresses = addresses
        .filter((addr) => {
            const account = onChainAccounts.find(a => a.address === addr);
            return !account || !account.linkedPublicKey;
        });

    if (invalidAddresses.length > 0) {
        throw argsError('account.not.linked', {
            addresses: invalidAddresses,
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
