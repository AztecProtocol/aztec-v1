import assetQuery from '~/background/services/GraphQLService/Queries/assetQuery';
import query from '../utils/query';

export default async request => query(request, assetQuery(`
    address
    linkedTokenAddress
    scalingFactor
    canAdjustSupply
    canConvert
`));
