import {
    errorLog,
} from '~utils/log';
import GraphNodeService from '~backgroundServices/GraphNodeService';

export default async function fetchNoteFromServer({
    account,
    lastSynced = 0,
    numberOfNotes = 1,
} = {}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    const query = `
        query($first: Int!, $where: NoteAccess_filter) {
            noteAccesses(first: $first, where: $where) {
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
            timestamp_gte: lastSynced,
        },
    };

    const data = await GraphNodeService.query({
        query,
        variables,
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
