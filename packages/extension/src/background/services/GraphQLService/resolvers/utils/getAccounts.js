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

    const registeredAccount = accounts || [];
    if (registeredAccount.length !== addresses.length) {
        const invalidAccounts = addresses
            .filter(addr => !registeredAccount.find(a => a.address === addr));
        throw argsError('account.not.linked', {
            registeredAccount,
            invalidAccounts,
        });
    }

    return accounts;
}
