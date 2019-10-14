import query from '../utils/query';
import AssetQuery from '../../../../ui/queries/AssetBalanceQuery';

export default async request => query(request, AssetQuery);
