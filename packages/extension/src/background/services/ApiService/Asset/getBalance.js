import assetQuery from '~/background/services/GraphQLService/Queries/assetQuery';
import query from '../utils/query';

export default async function getBalance(request) {
    const {
        asset: response,
    } = await query(request, assetQuery(`
        balance
    `));

    return response;
}
