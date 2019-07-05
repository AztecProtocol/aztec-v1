import noteStatus from '~config/noteStatus';
import {
    warnLog,
} from '~utils/log';

export default function fromAction(action) {
    if (!(action in noteStatus)) {
        warnLog(`Action '${action}' is not defined.`);
        return '';
    }

    return noteStatus[action];
}
