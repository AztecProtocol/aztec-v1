import usersQuery from '~/background/services/GraphQLService/Queries/usersQuery';
import query from '../utils/query';

export default async request => query(request, usersQuery(request.data.queryStr || `
    address
    linkedPublicKey
    spendingPublicKey
    publicKey
`));
