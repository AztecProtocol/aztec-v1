import accountQuery from '~/background/services/GraphQLService/Queries/accountQuery';
import query from '../utils/query';

export default async request => query(request, accountQuery(`
    address
    linkedPublicKey
    spendingPublicKey
`));
