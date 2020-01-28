import {
    actions,
} from '~/config/noteStatus';
import {
    warnLog,
} from '~/utils/log';

export default function fromAction(action) {
    if (!(action in actions)) {
        warnLog(`Action '${action}' is not defined.`);
        return '';
    }

    return actions[action];
}
