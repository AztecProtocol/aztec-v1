import filterStream from '~utils/filterStream';
import {
    actionRequestEvent,
    actionResponseEvent,
} from '~config/event';

const triggerClientAction = (query, connection) => async () => {
    const {
        data: {
            data,
        },
        requestId,
        ...rest
    } = query;
    connection.ClientActionSubject.next({
        ...rest,
        type: actionRequestEvent,
        requestId,
        data: {
            action: data.action,
            response: {
                ...data.response,
            },
            requestId,
        },
    });
    return filterStream(actionResponseEvent, requestId, connection.message$);
};

export default {
    triggerClientAction,
};
