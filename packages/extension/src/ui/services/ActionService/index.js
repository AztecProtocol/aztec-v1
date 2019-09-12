import ActionManager from './helpers/ActionManager';

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
};
