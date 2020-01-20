import accountsQuery from '~/background/services/GraphQLService/Queries/accountsQuery';
import query from './query';

export default async function validateAccounts(addresses) {
    const request = {
        domain: window.location.origin,
        data: {
            args: {
                where: {
                    address_in: addresses,
                },
            },
        },
    };
    const {
        accounts: response,
    } = await query(request, accountsQuery(`
        address
        linkedPublicKey
    `));

    return response.error ? response : null;
}
