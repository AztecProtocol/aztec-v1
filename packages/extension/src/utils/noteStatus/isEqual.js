import noteStatus from '~/config/noteStatus';
import {
    warnLog,
} from '~/utils/log';

const codeStatusMapping = {};
Object.keys(noteStatus).forEach((status) => {
    codeStatusMapping[noteStatus[status]] = status;
});

const getCode = (status) => {
    if (status in codeStatusMapping) {
        return status;
    }
    return noteStatus[status];
};

const isEqual = (status1, status2) => {
    const code1 = getCode(status1);
    const code2 = getCode(status2);
    if (code1 === undefined) {
        warnLog(`Status '${status1}' is not a valid status`);
    }
    if (code2 === undefined) {
        warnLog(`Status '${status2}' is not a valid status`);
    }

    return code1 === code2;
};

const makeIsEqual = status1 => status2 => isEqual(status1, status2);

export default isEqual;
export {
    makeIsEqual,
};
