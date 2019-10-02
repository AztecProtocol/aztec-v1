import ApiError from '~client/utils/ApiError';
import apollo from '../../../../background/services/GraphQLService';
import AccountsQuery from '../../../queries/AccountsQuery';

export default async function validateAccounts({
    accountAddress = '',
    domain,
    currentAddress,
}) {
    const addressInputs = typeof accountAddress === 'string'
        ? [accountAddress]
        : accountAddress;
    const validAddresses = addressInputs.map(addr => addr);
    const addressArrStr = validAddresses.map(a => `${a}`).join(',');

    const {
        data: {
            accounts: accountsResponse,
        },
    } = await apollo.query({
        query: AccountsQuery,
        variables: {
            addressArrStr,
            domain,
            currentAddress,
        },
    });

    const {
        accounts = [],
    } = accountsResponse || {};

    const invalidAccounts = validAddresses.filter(addr => !accounts.find(a => a.address === addr));
    if (invalidAccounts.length > 0) {
        throw new ApiError('account.not.linked', {
            address: invalidAccounts,
        });
    }

    return accounts;
}
