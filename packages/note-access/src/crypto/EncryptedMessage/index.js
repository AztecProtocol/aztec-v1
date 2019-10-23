import decryptMessage from '../decryptMessage';
import toHexString from './toHexString';

export default function EncryptedMessage(data) {
    return {
        export: () => data,
        toHexString: () => toHexString(data),
        decrypt: (privateKey) => decryptMessage(privateKey, data),
    };
}
