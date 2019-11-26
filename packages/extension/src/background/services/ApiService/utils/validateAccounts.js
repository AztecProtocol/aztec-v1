import AccountsQuery from '../queries/AccountsQuery';
import query from './query';

export default async function validateAccounts({
    addresses,
}) {
    const request = {
        domain: window.location.origin,
        data: {
            args: {
                addressArrStr: addresses,
            },
        },
    };

    const {
        accounts: response,
    } = await query(request, AccountsQuery);

    return response.error ? response : null;
}
