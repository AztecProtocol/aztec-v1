import noteQuery from '~/background/services/GraphQLService/Queries/noteQuery';
import query from '../utils/query';

export default async request => query(request, noteQuery(`
    decryptedViewingKey
    owner {
        address
    }
`));
