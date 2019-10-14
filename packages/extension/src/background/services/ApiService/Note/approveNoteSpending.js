import filterStream from '~utils/filterStream';

const triggerApproveNoteSpending = async (query, connection) => {
    const {
        data: {
            args,
        },
    } = query;
    connection.UiActionSubject.next({
        type: 'ui.note.approveSpending',
        requestId: query.requestId,
        clientId: query.clientId,
        data: {
            response: {
                ...args,
                requestId: query.requestId,
            },
        },
    });

    const resp = await filterStream('UI_RESPONSE', query.requestId, connection.MessageSubject.asObservable());
    return {
        ...query,
        response: {
            permission: {
                ...resp.data,
            },
        },
    };
};
export default triggerApproveNoteSpending;
