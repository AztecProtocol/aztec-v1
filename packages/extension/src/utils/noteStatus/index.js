import fromAction from './fromAction';
import {
    makeIsEqualToAction,
} from './isEqualToAction';

const isCreated = makeIsEqualToAction('CREATE');
const isDestroyed = makeIsEqualToAction('DESTROY');

export {
    fromAction,
    isCreated,
    isDestroyed,
};
