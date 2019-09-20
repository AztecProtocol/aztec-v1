import AuthService from '~background/services/AuthService';
import ensureAccount from '~background/services/GraphQLService/decorators/ensureAccount';
import ActionManager from './helpers/ActionManager';
import actionModel from '~database/models/action';

const manager = new ActionManager();

export default {
    openConnection: () => manager.openConnection(),
    post: (query, args = {}, defaultCallback = null) => {
        const requestId = manager.postToBackground({
            query,
            args,
        }, defaultCallback);
        return {
            onReceiveResponse: callback => manager.registerResponse(
                requestId,
                callback,
            ),
        };
    },
    get: async (actionId) => {
        const action = await actionModel.get({ id: actionId });
        return action;
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
