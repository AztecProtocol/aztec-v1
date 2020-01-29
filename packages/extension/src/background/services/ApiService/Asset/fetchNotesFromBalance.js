import fetchNotesFromBalanceQuery from '~/background/services/GraphQLService/Queries/fetchNotesFromBalanceQuery';
import query from '../utils/query';

export default async function fetchNotesFromBalance(request) {
    const {
        fetchNotesFromBalance: response,
    } = await query(
        request,
        fetchNotesFromBalanceQuery(`
            noteHash
            value
        `),
    ) || {};

    return response;
}
