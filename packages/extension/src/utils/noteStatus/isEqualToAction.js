import {
    actions,
} from '~/config/noteStatus';

const statusActionMapping = {};
Object.keys(actions).forEach((action) => {
    statusActionMapping[actions[action]] = action;
});

const isEqualToAction = (status, action) => statusActionMapping[status] === action;

const makeIsEqualToAction = action => status => isEqualToAction(status, action);

export default isEqualToAction;
export {
    makeIsEqualToAction,
};
