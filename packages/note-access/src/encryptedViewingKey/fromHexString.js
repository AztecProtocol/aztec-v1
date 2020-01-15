import { warnLog } from '@aztec/dev-utils';
import { VIEWING_KEY_LENGTH } from '../config/constants';
import recoverFromHexString from '../crypto/fromHexString';
import decrypt from './decrypt';

export default function fromHexString(str) {
    const bytes = str.replace(/^0x/, '');
    if (bytes.length !== VIEWING_KEY_LENGTH) {
        warnLog('Wrong viewing key string length.', str);
        return null;
    }

    const encrypted = recoverFromHexString(str);
    encrypted.decrypt = (privateKey) => decrypt(privateKey, encrypted);

    return encrypted;
}
