import filterStream from '~utils/filterStream';
import {
    actionEvent,
} from '~config/event';

const triggerClientAction = (query, connection) => async () => {
    connection.ClientActionSubject.next({
        type: actionEvent,
        clientId: query.clientId,
        requestId: query.requestId,
        data: {
            action: query.args.action,
            response: {
                ...query.args,
            },
            requestId: query.requestId,
        },
    });
    return filterStream('ACTION_RESPONSE', query.requestId, connection.ActionResponseSubject.asObservable());
};

export default {
    triggerClientAction,
};
