import {
    errorLog,
} from '~utils/log';
import GraphNodeService from '~background/services/GraphNodeService';

export default async function fetchNoteFromServer({
    account,
    noteId = '',
    lastSynced = '',
    registeredAt = 0,
    numberOfNotes = 1,
    excludes = [],
    onError,
} = {}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    const query = !noteId
        ? `
            query($first: Int!, $where: NoteLog_filter, $orderBy: NoteLog_orderBy) {
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
                                scalingFactor
                                canAdjustSupply
                                canConvert
                            }
                            owner {
                                address
                            }
                        }
                    }
                    status
                }
            }
        `
        : `
            query($first: Int!, $where: NoteAccess_filter, $orderBy: NoteAccess_orderBy) {
                noteAccesses(first: $first, where: $where, orderBy: $orderBy, orderDirection: "desc") {
                    account {
                        address
                    }
                    viewingKey
                    note {
                        hash
                        asset {
                            address
                            linkedTokenAddress
                            scalingFactor
                            canAdjustSupply
                            canConvert
                        }
                        owner {
                            address
                        }
                        status
                    }
                }
            }
        `;

    const where = {
        account,
        id_gt: lastSynced,
        id_not_in: excludes,
    };
    if (noteId) {
        where.note = noteId;
    }
    if (registeredAt) {
        where.timestamp_gte = parseInt(registeredAt / 10000);
    }
    const variables = {
        first: numberOfNotes,
        where,
        orderBy: noteId ? 'timestamp' : 'id',
    };

    const data = await GraphNodeService.query({
        query,
        variables,
        onError,
    });

    const {
        noteLogs = [],
        noteAccesses = [],
    } = data || {};

    if (noteId) {
        return noteAccesses.map(({
            note,
            ...rest
        }) => ({
            ...rest,
            ...note,
        }));
    }

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
