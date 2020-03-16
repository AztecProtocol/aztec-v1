import {
    actionRequestEvent,
    sendTransactionEvent,
    sendQueryEvent,
    uiReturnEvent,
    uiCloseEvent,
} from '~/config/event';
import AuthService from '~/background/services/AuthService';
import ConnectionManager from './helpers/ConnectionManager';

const manager = new ConnectionManager();

export default {
    openConnection: listener => manager.openConnection(listener),
    close: ({
        abort = false,
        error = null,
    } = {}) => manager.postToBackground({
        type: uiCloseEvent,
        clientRequestId: manager.clientRequestId,
        data: {
            abort,
            error,
        },
    }),
    post: async ({
        clientRequestId = '',
        action,
        data = {},
    }) => manager.postToBackground({
        type: actionRequestEvent,
        clientRequestId: clientRequestId || manager.clientRequestId,
        data: {
            action,
            params: data,
        },
    }),
    sendTransaction: async ({
        clientRequestId = '',
        contract,
        contractAddress,
        method,
        data,
    }) => manager.postToBackground({
        type: sendTransactionEvent,
        clientRequestId: clientRequestId || manager.clientRequestId,
        data: {
            contract,
            contractAddress,
            method,
            params: data,
        },
    }),
    query: async ({
        query,
        data,
    }) => {
        const currentUser = await AuthService.getCurrentUser();
        return manager.postToBackground({
            type: sendQueryEvent,
            data: {
                query,
                args: {
                    ...data,
                    domain: window.location.origin,
                    currentAddress: currentUser.address,
                },
            },
        });
    },
    returnToClient: data => manager.postToBackground({
        type: uiReturnEvent,
        clientRequestId: manager.clientRequestId,
        data,
    }),
};
