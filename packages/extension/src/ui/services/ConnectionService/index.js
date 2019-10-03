import {
    actionEvent,
    sendTransactionEvent,
} from '~config/event';
import ConnectionManager from './helpers/ConnectionManager';

const manager = new ConnectionManager();

export default {
    openConnection: () => manager.openConnection(),
    post: async (
        clientRequestId,
        actionName,
        data = {},
    ) => manager.postToBackground({
        type: actionEvent,
        clientRequestId,
        data: {
            action: actionName,
            response: data,
        },
    }),
    sendTransaction: async (
        contract,
        method,
        data,
    ) => manager.postToBackground({
        type: sendTransactionEvent,
        data: {
            contract: typeof contract === 'string' ? contract : contract.name,
            contractAddress: typeof contract === 'string' ? '' : contract.address,
            method,
            params: data,
        },
    }),
};
