import {
    errorLog,
} from '~utils/log';

export default function errorAction(message) {
    errorLog(message);

    return {
        data: {},
        modified: [],
    };
}
