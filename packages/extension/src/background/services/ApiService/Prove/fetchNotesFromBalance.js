import apollo from '../../GraphQLService';
import FetchNotesFromBalanceQuery from '../queries/FetchNotesFromBalanceQuery';

export const schema = {
    id: '/FetchNoteFromBalance',
    properties: {
        owner: {
            type: 'string',
            minLength: 42,
            maxLength: 42,
        },
        equalTo: {
            type: 'number',
        },
        greaterThan: {
            type: 'number',
        },
        lessThan: {
            type: 'number',
        },
        numberOfNotes: {
            type: 'number',
        },
        allowLessNumberOfNotes: {
            type: 'boolean',
        },
        required: [
            'owner',
        ],
    },
};

export default async function fetchNotesFromBalance(variables) {
    const {
        data: {
            fetchNotesFromBalance: response,
        },
    } = await apollo.query({
        query: FetchNotesFromBalanceQuery,
        variables,
    }) || {};

    return response;
}
