import { warnLog } from '@aztec/dev-utils';
import { REAL_VIEWING_KEY_LENGTH } from '../config/constants';
import { encryptMessage } from '../crypto';
import decrypt from './decrypt';

export default function constructor(publicKey, realViewingKey) {
    const formattedViewingKey = realViewingKey.replace(/^0x/, '');
    if (formattedViewingKey.length !== REAL_VIEWING_KEY_LENGTH) {
        warnLog('Wrong viewing key size.');
        return null;
    }

    const encrypted = encryptMessage(publicKey, formattedViewingKey);
    encrypted.decrypt = (privateKey) => decrypt(privateKey, encrypted);

    return encrypted;
}
