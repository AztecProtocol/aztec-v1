import {
    VIEWING_KEY_LENGTH,
} from '~config/constants';
import {
    warnLog,
} from '~utils/log';
import EncryptedMessage from '~utils/crypto/EncryptedMessage';
import lengthConfig from './lengthConfig';
import decrypt from './decrypt';

export default function fromHexString(str) {
    const bytes = str.replace(/^0x/, '');
    if (bytes.length !== VIEWING_KEY_LENGTH) {
        warnLog('Wrong viewing key string size.');
        return null;
    }

    const encryptedData = {};
    let startAt = 0;
    Object.keys(lengthConfig)
        .forEach((key) => {
            const len = lengthConfig[key];
            encryptedData[key] = `0x${bytes.slice(startAt, startAt + len)}`;
            startAt += len;
        });

    const encrypted = EncryptedMessage(encryptedData);
    encrypted.decrypt = privateKey => decrypt(privateKey, encrypted);

    return encrypted;
}
