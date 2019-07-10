import Query from '~utils/Query';
import {
    errorLog,
} from '~utils/log';

export default async function fetchNoteFromServer({
    graphQLServerUrl = 'http://localhost:4000/',
    numberOfNotes = 1,
    account,
    lastId = '',
} = {}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    const query = `
        query($numberOfNotes: Int!, $account: ID, $lastId: ID) {
            noteChangeLog(first: $numberOfNotes, account: $account, id_gt: $lastId) {
                id
                noteAccess {
                    account {
                        address
                    }
                    sharedSecret
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
                timestamp
            }
        }
    `;

    const variables = {
        numberOfNotes,
        account,
        lastId,
    };

    const data = await Query({
        graphQLServerUrl,
        query,
        variables,
    });

    const {
        noteChangeLog = [],
    } = data || {};

    return noteChangeLog.map(({
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
