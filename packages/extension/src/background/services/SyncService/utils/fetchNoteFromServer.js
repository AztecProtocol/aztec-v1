import {
    errorLog,
} from '~utils/log';
import GraphNodeService from '~backgroundServices/GraphNodeService';

export default async function fetchNoteFromServer({
    numberOfNotes = 1,
    account,
    lastId = '',
} = {}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    const query = `
        query($first: Int!, $where: NoteChangeLogsWhere) {
            noteChangeLogs(first: $first, where: $where) {
                id
                noteAccess {
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
                    }
                }
                action
            }
        }
    `;

    const variables = {
        first: numberOfNotes,
        where: {
            id_gt: lastId,
            account,
        },
    };

    const data = await GraphNodeService.query({
        query,
        variables,
    });

    const {
        noteChangeLogs = [],
    } = data || {};

    return noteChangeLogs.map(({
        id: logId,
        noteAccess: {
            note,
            ...noteAccess
        },
        ...rest
    }) => ({
        ...note,
        ...noteAccess,
        ...rest,
        logId,
    }));
}
