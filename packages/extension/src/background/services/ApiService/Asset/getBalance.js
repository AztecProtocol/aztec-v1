import query from '../utils/query';
import AssetBalanceQuery from '../queries/AssetBalanceQuery';


export default async request => query(request, AssetBalanceQuery);
