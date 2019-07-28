import {
    warnLog,
} from '~utils/log';
import lengthConfig from './lengthConfig';

export default function constructor(str) {
    const viewingKey = {};
    let startAt = str.startsWith('0x')
        ? 2
        : 0;
    Object.keys(lengthConfig)
        .forEach((key) => {
            const len = lengthConfig[key];
            viewingKey[key] = `0x${str.slice(startAt, startAt + len)}`;
            startAt += len;
        });

    const wrongFormat = Object.keys(viewingKey)
        .find(key => viewingKey[key].length !== (lengthConfig[key] + 2));

    if (wrongFormat) {
        warnLog(`Wrong viewing key format. input = ${str}`);
        return null;
    }

    return viewingKey;
}
