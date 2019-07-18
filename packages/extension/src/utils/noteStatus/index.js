import toCode from './toCode';
import fromCode from './fromCode';
import fromAction from './fromAction';
import isEqual, {
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
    toCode,
    fromCode,
    fromAction,
    isEqual,
    isCreated,
    isDestroyed,
    isCreateAction,
    isDestroyAction,
};
