import OriginActionService from '~ui/services/ActionService';
import actions from '../actions';

const ActionService = {
    ...OriginActionService,
    get: (actionId = -1) => actions[actionId],
};

export default ActionService;
