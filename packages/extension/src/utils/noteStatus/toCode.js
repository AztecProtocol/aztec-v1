import noteStatus from '~/config/noteStatus';
import {
    warnLog,
} from '~/utils/log';

export default function toCode(status) {
    if (!(status in noteStatus)) {
        warnLog(`Status '${status}' is not defined.`);
        return '';
    }

    return noteStatus[status];
}
