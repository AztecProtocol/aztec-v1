import nacl from './nacl';
import fromHexString from './fromHexString';
import {
    errorLog,
} from '~utils/log';

export default function decryptMessage(privateKey, encryptedData) {
    let output;
    try {
        const privateKeyBase64 = Buffer.from(privateKey, 'hex').toString('base64');
        const privateKeyUint8Array = nacl.util.decodeBase64(privateKeyBase64);
        const recieverEncryptionPrivateKey = nacl
            .box
            .keyPair
            .fromSecretKey(privateKeyUint8Array)
            .secretKey;

        const encryptedMessage = 'export' in encryptedData
            ? encryptedData.export()
            : encryptedData;
        const nonce = fromHexString(encryptedMessage.nonce);
        const ciphertext = fromHexString(encryptedMessage.ciphertext);
        const ephemPublicKey = fromHexString(encryptedMessage.ephemPublicKey);

        const decryptedMessage = nacl.box.open(
            ciphertext,
            nonce,
            ephemPublicKey,
            recieverEncryptionPrivateKey,
        );

        if (decryptedMessage) {
            output = nacl.util.encodeUTF8(decryptedMessage);
        }
    } catch (error) {
        errorLog('Decryption failed.', error);
    }

    return output || '';
}
