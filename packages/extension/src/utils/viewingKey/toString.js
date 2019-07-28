import {
    VIEWING_KEY_LENGTH,
} from '~config/constants';
import {
    warnLog,
} from '~utils/log';
import lengthConfig from './lengthConfig';

export default function toString(viewingKey) {
    const {
        ciphertext,
        ephemPublicKey,
        nonce,
    } = viewingKey;

    const str = [
        ciphertext,
        ephemPublicKey.slice(2),
        nonce.slice(2),
    ].join('');

    if (str.length !== VIEWING_KEY_LENGTH + 2) {
        const wrongField = Object.keys(viewingKey)
            .find((key) => {
                const hash = viewingKey[key].replace(/^0x/, '');
                return hash.length !== lengthConfig[key];
            });
        warnLog(
            'Wrong viewing key format.',
            `'${wrongField}' should be ${lengthConfig[wrongField]} long.`,
        );
        return '';
    }

    return str;
}
