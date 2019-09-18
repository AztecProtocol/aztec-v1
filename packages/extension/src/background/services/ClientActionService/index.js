import filterStream from '~utils/filterStream';
import {
    actionEvent,
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
        type: actionEvent,
        requestId,
        data: {
            action: data.action,
            response: {
                ...data.response,
            },
            requestId,
        },
    });
    return filterStream('ACTION_RESPONSE', requestId, connection.message$);
};

export default {
    triggerClientAction,
};
