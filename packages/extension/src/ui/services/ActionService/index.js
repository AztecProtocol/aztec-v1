import actionModel from '~database/models/action';

export default {
    get: async (actionId) => {
        if (!actionId) {
            return null;
        }
        return actionModel.get({ id: actionId });
    },
};
