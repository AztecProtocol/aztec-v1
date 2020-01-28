import nacl from './nacl';
import toUint8Array from './toUint8Array';
import {
    errorLog,
} from '~/utils/log';

export default function batchDecrypt(privateKey, encryptedDataArr) {
    const privateKeyHash = privateKey.replace(/^0x/, '');
    let outputArr;
    try {
        const privateKeyBase64 = Buffer.from(privateKeyHash, 'hex').toString('base64');
        const privateKeyUint8Array = nacl.util.decodeBase64(privateKeyBase64);
        const recieverEncryptionPrivateKey = nacl
            .box
            .keyPair
            .fromSecretKey(privateKeyUint8Array)
            .secretKey;

        outputArr = encryptedDataArr.map((encrypted) => {
            const encryptedMessage = 'export' in encrypted
                ? encrypted.export()
                : encrypted;
            const nonce = toUint8Array(encryptedMessage.nonce);
            const ciphertext = toUint8Array(encryptedMessage.ciphertext);
            const ephemPublicKey = toUint8Array(encryptedMessage.ephemPublicKey);

            const decryptedMessage = nacl.box.open(
                ciphertext,
                nonce,
                ephemPublicKey,
                recieverEncryptionPrivateKey,
            );

            return decryptedMessage
                ? nacl.util.encodeUTF8(decryptedMessage)
                : '';
        });
    } catch (error) {
        errorLog('Decryption failed.', error);
    }

    return outputArr || [];
}
