import query from '../utils/query';
import AssetBalanceQuery from '../queries/AssetBalanceQuery';

export default async function getBalance(request) {
    const {
        asset: response,
    } = await query(request, AssetBalanceQuery);

    return response;
}
