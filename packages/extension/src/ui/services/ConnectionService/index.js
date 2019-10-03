import {
    actionEvent,
    sendTransactionEvent,
} from '~config/event';
import ConnectionManager from './helpers/ConnectionManager';

const manager = new ConnectionManager();

export default {
    openConnection: () => manager.openConnection(),
    setDefaultClientRequestId: id => manager.setDefaultClientRequestId(id),
    post: async ({
        clientRequestId = '',
        action,
        data = {},
    }) => manager.postToBackground({
        type: actionEvent,
        clientRequestId,
        data: {
            action,
            response: data,
        },
    }),
    sendTransaction: async ({
        contract,
        contractAddress,
        method,
        data,
    }) => manager.postToBackground({
        type: sendTransactionEvent,
        data: {
            contract,
            contractAddress,
            method,
            params: data,
        },
    }),
};
