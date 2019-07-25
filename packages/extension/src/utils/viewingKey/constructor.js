import {
    warnLog,
} from '~utils/log';

const lengthMapping = {
    ciphertext: 314,
    ephemPublicKey: 66,
    nonce: 50,
};

export default function constructor(str) {
    const viewingKey = {};
    let startAt = 2;
    Object.keys(lengthMapping)
        .forEach((key) => {
            const len = lengthMapping[key];
            viewingKey[key] = `0x${str.slice(startAt, startAt + len - 2)}`;
            startAt += (len - 2);
        });

    const wrongFormat = Object.keys(viewingKey)
        .find(key => viewingKey[key].length !== lengthMapping[key]);

    if (wrongFormat) {
        warnLog(`Wrong viewing key format. input = ${str}`);
        return '';
    }

    return viewingKey;
}
