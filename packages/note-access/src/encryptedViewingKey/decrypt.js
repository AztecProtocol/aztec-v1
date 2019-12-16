import { warnLog } from '@aztec/dev-utils';
import { decryptMessage } from '../crypto';
import lengthConfig from './lengthConfig';

export default function decrypt(privateKey, encrypted) {
    const encryptedData = 'export' in encrypted ? encrypted.export() : encrypted;

    const wrongKey = Object.keys(encryptedData).find((key) => encryptedData[key].length !== lengthConfig[key] + 2);
    if (wrongKey) {
        warnLog(
            'Wrong encrypted viewing key format.',
            `'${wrongKey}' should have length ${lengthConfig[wrongKey]} but got ${encryptedData[wrongKey].length}`,
        );
        return null;
    }

    const bytes = decryptMessage(privateKey, encryptedData);
    if (!bytes) {
        return '';
    }

    return `0x${bytes}`;
}
