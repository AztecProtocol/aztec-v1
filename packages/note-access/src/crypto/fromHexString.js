import { warnLog } from '@aztec/dev-utils';
import EncryptedMessage from './EncryptedMessage';
import lengthConfig from './lengthConfig';

export default function fromHexString(str) {
    const hash = str.replace(/^0x/, '');
    if (hash.length < 48 + 64) {
        warnLog('Wrong encrypted string length.', str);
        return null;
    }

    const encryptedData = {};
    let start = 0;
    Object.keys(lengthConfig).forEach((key) => {
        const len = lengthConfig[key];
        encryptedData[key] = `0x${hash.substr(start, len)}`;
        start += len;
    });
    encryptedData.ciphertext = `0x${hash.substr(start)}`;

    return EncryptedMessage(encryptedData);
}
