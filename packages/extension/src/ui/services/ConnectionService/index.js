import {
    actionEvent,
    sendTransactionEvent,
    uiQueryEvent,
    uiResponseEvent,
    uiCloseEvent,
} from '~config/event';
import AuthService from '~background/services/AuthService';
import ConnectionManager from './helpers/ConnectionManager';

const manager = new ConnectionManager();

export default {
    openConnection: () => manager.openConnection(),
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
    setDefaultClientRequestId: id => manager.setDefaultClientRequestId(id),
    post: async ({
        clientRequestId = '',
        action,
        data = {},
    }) => manager.postToBackground({
        type: actionEvent,
        clientRequestId: clientRequestId || manager.clientRequestId,
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
    query: async ({
        query,
        data,
    }) => {
        const currentUser = await AuthService.getCurrentUser();
        return manager.postToBackground({
            type: uiQueryEvent,
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
        type: uiResponseEvent,
        clientRequestId: manager.clientRequestId,
        data,
    }),
};
