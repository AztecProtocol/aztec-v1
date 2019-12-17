import noteStatus from '~/config/noteStatus';
import {
    warnLog,
} from '~/utils/log';

const codeStatusMapping = {};
Object.keys(noteStatus).forEach((status) => {
    codeStatusMapping[noteStatus[status]] = status;
});

export default function fromCode(code) {
    if (!(code in codeStatusMapping)) {
        warnLog(`Status code '${code}' is not defined.`);
        return '';
    }

    return codeStatusMapping[code];
}
