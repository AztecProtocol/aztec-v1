import {
    errorLog,
} from '~utils/log';
import GraphNodeService from '~backgroundServices/GraphNodeService';

export default async function fetchNoteFromServer({
    account,
    lastSynced = 0,
    numberOfNotes = 1,
    excludes = [],
    onError,
} = {}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    const query = `
        query($first: Int!, $where: NoteAccess_filter, $orderBy: NoteAccess_orderBy) {
            noteAccesses(first: $first, where: $where, orderBy: $orderBy) {
                account {
                    address
                }
                viewingKey
                note {
                    hash
                    asset {
                        address
                    }
                    owner {
                        address
                    }
                    status
                }
                timestamp
            }
        }
    `;

    const variables = {
        first: numberOfNotes,
        where: {
            account,
            note_not_in: excludes,
            timestamp_gte: lastSynced,
        },
        orderBy: 'timestamp',
    };

    const data = await GraphNodeService.query({
        query,
        variables,
        onError,
    });

    const {
        noteAccesses = [],
    } = data || {};

    return noteAccesses.map(({
        note,
        ...rest
    }) => ({
        ...note,
        ...rest,
    }));
}
