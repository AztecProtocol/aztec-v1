import query from '../utils/query';
import AssetBalanceQuery from '../../../../ui/queries/AssetBalanceQuery';

export default async request => query(request, AssetBalanceQuery);
