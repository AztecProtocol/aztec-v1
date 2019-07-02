import Query from '~utils/Query';

export default async function fetchNoteFromServer({
    graphQLServerUrl = 'http://localhost:4000/',
    numberOfNotes = 1,
    account = '',
    lastId = '',
} = {}) {
    let query;
    const variables = {
        numberOfNotes,
        lastId,
    };
    if (account) {
        query = `
            query($numberOfNotes: Int!, $lastId: ID, $account: ID) {
                noteAccess(first: $numberOfNotes, id_gt: $lastId, account: $account) {
                    note {
                        id
                        hash
                        asset {
                            id
                        }
                        owner {
                            id
                        }
                    }
                }
            }
        `;

        variables.account = account;
    } else {
        query = `
            query($numberOfNotes: Int!, $lastId: ID) {
                notes(first: $numberOfNotes, id_gt: $lastId) {
                    id
                    hash
                    asset {
                        id
                    }
                }
            }
        `;
    }

    const data = await Query({
        graphQLServerUrl,
        query,
        variables,
    });

    if (account) {
        const noteAccess = (data && data.noteAccess) || [];
        return noteAccess.map(n => n.note);
    }

    return (data && data.notes) || [];
}
