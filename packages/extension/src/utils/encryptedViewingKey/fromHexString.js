import {
    VIEWING_KEY_LENGTH,
} from '~/config/constants';
import {
    warnLog,
} from '~/utils/log';
import recoverFromHexString from '~/utils/crypto/fromHexString';
import decrypt from './decrypt';

export default function fromHexString(str) {
    const bytes = str.replace(/^0x/, '');
    if (bytes.length !== VIEWING_KEY_LENGTH) {
        warnLog('Wrong viewing key string length.', str);
        return null;
    }

    const encrypted = recoverFromHexString(str);
    encrypted.decrypt = privateKey => decrypt(privateKey, encrypted);

    return encrypted;
}
