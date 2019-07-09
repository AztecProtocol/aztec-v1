import noteStatus from '~config/noteStatus';

const statusActionMapping = {};
Object.keys(noteStatus).forEach((action) => {
    statusActionMapping[noteStatus[action]] = action;
});

const isEqualToAction = (status, action) => statusActionMapping[status] === action;

const makeIsEqualToAction = action => status => isEqualToAction(status, action);

export default isEqualToAction;
export {
    makeIsEqualToAction,
};
