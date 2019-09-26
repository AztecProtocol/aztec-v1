import {
    argsError,
} from '~utils/error';
import EventService from '~background/services/EventService';


export default async function getAccounts(args, ctx = {}) {
    const {
        where: {
            address_in: addresses,
            // TODO
            // should support more filters
        },
    } = args;
    console.log(args);

    const {
        // TODO: remove default value, when it will be passed here.
        networkId = 0,
    } = ctx;

    const promises = [];
    addresses.forEach((address) => {
        const accountPromise = EventService.fetchAztecAccount({
            address,
            networkId,
        });
        promises.push(accountPromise);
    });

    const accounts = Promise.all(promises);
    accounts.map(({ error, account: { address, linkedPublicKey } }) => ({
        id: address,
        address,
        linkedPublicKey,
    }));

    console.log(accounts);

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

    return accounts;
}
