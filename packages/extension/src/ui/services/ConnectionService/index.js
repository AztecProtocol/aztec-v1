import {
    actionEvent,
    sendTransactionEvent,
} from '~config/event';
import ConnectionManager from './helpers/ConnectionManager';

const manager = new ConnectionManager();

export default {
    openConnection: () => manager.openConnection(),
    post: (
        requestId,
        actionName,
        data = {},
        defaultCallback = null,
    ) => manager.postToBackground({
        type: actionEvent,
        requestId,
        data: {
            action: actionName,
            response: data,
        },
    }, defaultCallback),
    sendTransaction: (
        requestId,
        contract,
        method,
        data,
        defaultCallback = null,
    ) => manager.postToBackground({
        type: sendTransactionEvent,
        requestId,
        data: {
            contract,
            method,
            params: data,
        },
    }, defaultCallback),
};
