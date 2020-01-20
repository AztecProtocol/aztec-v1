import noteQuery from '~/background/services/GraphQLService/Queries/noteQuery';
import query from '../utils/query';

export default async (request) => {
    const {
        note,
    } = await query(request, noteQuery(`
        noteHash
        value
        asset {
            address
            linkedTokenAddress
        }
        owner {
            address
        }
        status
    `));

    return note;
};
