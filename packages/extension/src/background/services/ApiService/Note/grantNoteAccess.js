import {
    uiReturnEvent,
} from '~/config/event';
import filterStream from '~utils/filterStream';

const triggerGrantNoteAccessUi = async (query, connection) => {
    const {
        data: {
            args,

        },
    } = query;
    connection.UiActionSubject.next({
        type: 'ui.note.grantAccess',
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

    return {
        ...query,
        response: {
            permission: {
                ...resp.data,
            },
        },
    };
};
export default triggerGrantNoteAccessUi;
