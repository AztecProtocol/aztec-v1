import userQuery from '~/background/services/GraphQLService/Queries/userQuery';
import query from '../utils/query';

export default async request => query(request, userQuery(`
    address
    linkedPublicKey
    spendingPublicKey
    publicKey
`));
