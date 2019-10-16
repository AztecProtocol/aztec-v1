import apollo from '../../GraphQLService';
import AccountsQuery from '../queries/AccountsQuery';

export default async function validateAccounts({
    addresses,
    domain,
    currentAddress,
}) {
    const {
        data: {
            accounts: accountsResponse,
        },
    } = await apollo.query({
        query: AccountsQuery,
        variables: {
            addressArrStr: addresses,
            domain,
            currentAddress,
        },
    });
    return accountsResponse;
}
