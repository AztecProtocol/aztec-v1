import { REAL_VIEWING_KEY_LENGTH } from '../config/constants';
import { warnLog } from '../log';
import { encryptMessage } from '../crypto';
import decrypt from './decrypt';

export default function constructor(publicKey, realViewingKey) {
    const realVkHash = realViewingKey.replace(/^0x/, '');
    if (realVkHash.length !== REAL_VIEWING_KEY_LENGTH) {
        warnLog('Wrong viewing key size.');
        return null;
    }

    const encrypted = encryptMessage(publicKey, realVkHash);
    encrypted.decrypt = (privateKey) => decrypt(privateKey, encrypted);

    return encrypted;
}
