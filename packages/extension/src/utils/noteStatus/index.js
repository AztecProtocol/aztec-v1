import fromAction from './fromAction';
import {
    makeIsEqual,
} from './isEqual';
import {
    makeIsEqualToAction,
} from './isEqualToAction';

const isCreated = makeIsEqual('CREATED');
const isDestroyed = makeIsEqual('DESTROYED');

const isCreateAction = makeIsEqualToAction('CREATE');
const isDestroyAction = makeIsEqualToAction('DESTROY');

export {
    fromAction,
    isCreated,
    isDestroyed,
    isCreateAction,
    isDestroyAction,
};
