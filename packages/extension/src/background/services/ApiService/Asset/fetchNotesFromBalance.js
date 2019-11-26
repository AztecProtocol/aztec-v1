import query from '../utils/query';
import FetchNotesFromBalanceQuery from '../queries/FetchNotesFromBalanceQuery';

export default async function fetchNotesFromBalance(request) {
    const {
        fetchNotesFromBalance: response,
    } = await query(request, FetchNotesFromBalanceQuery) || {};

    return response;
}
