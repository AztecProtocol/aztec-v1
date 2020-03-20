import noteQuery from '~/background/services/GraphQLService/Queries/noteQuery';
import query from '../utils/query';

export default async (request) => {
    const {
        note,
    } = await query(request, noteQuery(request.data.requestedFields || `
        noteHash
        value
        asset {
            address
            linkedTokenAddress
        }
        owner {
            address
        }
        viewingKey
        status
    `));

    return note;
};
