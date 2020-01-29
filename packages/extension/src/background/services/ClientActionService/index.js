import filterStream from '~/utils/filterStream';
import {
    actionRequestEvent,
    actionResponseEvent,
} from '~/config/event';

const triggerClientAction = async (query, connection) => {
    const {
        requestId,
    } = query;
    connection.ClientActionSubject.next({
        ...query,
        type: actionRequestEvent,
    });

    return filterStream(actionResponseEvent, requestId, connection.message$);
};

export default {
    triggerClientAction,
};
