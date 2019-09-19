import GraphNodeService from '~background/services/GraphNodeService';
import {
    argsError,
} from '~utils/error';

export default async function getAccounts(args) {
    const {
        where: {
            address_in: addresses,
            // TODO
            // should support more filters
        },
    } = args;

    console.log(`------ Account getAccounts`);

    const queryStr = `
        query ($accountCount: Int!, $accountFilter: Account_filter!) {
            accounts(first: $accountCount, where: $accountFilter) {
                id
                address
                linkedPublicKey
            }
        }
    `;
    const variables = {
        accountCount: addresses.length,
        accountFilter: {
            address_in: addresses,
        },
    };
    const {
        accounts,
    } = await GraphNodeService.query({
        query: queryStr,
        variables,
    }) || {};

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
