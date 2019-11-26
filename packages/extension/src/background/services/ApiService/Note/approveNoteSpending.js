import {
    uiReturnEvent,
} from '~/config/event';
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

    const resp = await filterStream(
        uiReturnEvent,
        query.requestId,
        connection.MessageSubject.asObservable(),
    );

    const {
        data,
    } = resp || {};

    return data;
};

export default triggerApproveNoteSpending;
