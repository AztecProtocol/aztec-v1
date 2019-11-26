import query from '../utils/query';
import AssetQuery from '../queries/AssetQuery';

export default async request => query(request, AssetQuery);
