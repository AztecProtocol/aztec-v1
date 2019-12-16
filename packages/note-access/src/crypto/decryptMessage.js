import { errorLog } from '@aztec/dev-utils';
import nacl from './nacl';
import toUint8Array from './toUint8Array';

export default function decryptMessage(privateKey, encryptedData) {
    if (typeof encryptedData === 'string') {
        errorLog('Please provide an EncryptedMessage object as the second parameter.');
        return '';
    }
    const privateKeyHash = privateKey.replace(/^0x/, '');
    let output;
    try {
        const privateKeyBase64 = Buffer.from(privateKeyHash, 'hex').toString('base64');
        const privateKeyUint8Array = nacl.util.decodeBase64(privateKeyBase64);
        const recieverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(privateKeyUint8Array).secretKey;

        const encryptedMessage = 'export' in encryptedData ? encryptedData.export() : encryptedData;
        const nonce = toUint8Array(encryptedMessage.nonce);
        const ciphertext = toUint8Array(encryptedMessage.ciphertext);
        const ephemPublicKey = toUint8Array(encryptedMessage.ephemPublicKey);

        const decryptedMessage = nacl.box.open(ciphertext, nonce, ephemPublicKey, recieverEncryptionPrivateKey);

        if (decryptedMessage) {
            output = nacl.util.encodeUTF8(decryptedMessage);
        }
    } catch (error) {
        errorLog('Decryption failed.', error);
    }

    return output || '';
}
