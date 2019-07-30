import {
    errorLog,
} from '~utils/log';
import GraphNodeService from '~backgroundServices/GraphNodeService';

export default async function fetchNoteFromServer({
    account,
    lastSynced = '',
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
            noteLogs(first: $first, where: $where, orderBy: $orderBy) {
                logId: id
                account {
                    address
                }
                noteAccess {
                    viewingKey
                    note {
                        hash
                        asset {
                            address
                            linkedTokenAddress
                        }
                        owner {
                            address
                        }
                    }
                }
                status
            }
        }
    `;

    const variables = {
        first: numberOfNotes,
        where: {
            account,
            id_gt: lastSynced,
            id_not_in: excludes,
        },
        orderBy: 'id',
    };

    const data = await GraphNodeService.query({
        query,
        variables,
        onError,
    });

    const {
        noteLogs = [],
    } = data || {};

    return noteLogs.map(({
        noteAccess: {
            note,
            ...noteAccess
        },
        ...rest
    }) => ({
        ...noteAccess,
        ...note,
        ...rest,
    }));
}
