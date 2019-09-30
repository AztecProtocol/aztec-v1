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
    const invalidInputs = validAddresses.filter((addr, i) => !validAddresses[i]);
    if (invalidInputs.length > 0) {
        throw new ApiError('input.address.not.valid', {
            address: invalidInputs,
        });
    }

    console.log({ accountAddress });

    const addressArrStr = validAddresses.map(a => `${a}`).join(',');

    const {
        data: {
            accounts: accountsResponse,
        },
        ...rest
    } = await apollo.query({
        query: AccountsQuery,
        variables: {
            addressArrStr,
            domain,
            currentAddress,
        },
    });
    console.log(rest, accountsResponse);

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
