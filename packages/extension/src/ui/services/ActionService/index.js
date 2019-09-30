import {
    actionEvent,
    sendTransactionEvent,
} from '~config/event';
import AuthService from '~background/services/AuthService';
import ensureAccount from '~background/services/GraphQLService/decorators/ensureAccount';
import ActionManager from './helpers/ActionManager';
import actionModel from '~database/models/action';

const manager = new ActionManager();

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
    get: async (actionId) => {
        if (!actionId) {
            return null;
        }
        return actionModel.get({ id: actionId });
    },
    isLoggedIn: async () => {
        try {
            const {
                address: currentAddress,
            } = await AuthService.getCurrentUser() || {};
            if (!currentAddress) {
                return false;
            }

            const {
                error,
            } = await ensureAccount(() => {})(null, { currentAddress }) || {};

            return !error;
        } catch (error) {
            return false;
        }
    },
};
