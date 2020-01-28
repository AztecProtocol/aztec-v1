import {
    errorLog,
} from '~/utils/log';
import nacl from './nacl';
import toUint8Array from './toUint8Array';
import toHexString from './toHexString';
import EncryptedMessage from './EncryptedMessage';

export default function batchEncrypt(publicKey, messsages) {
    const ephemeralKeyPair = nacl.box.keyPair();
    let pubKeyUInt8Array;

    try {
        pubKeyUInt8Array = toUint8Array(publicKey);
    } catch (error) {
        errorLog('Bad public key', error);
        return null;
    }

    const encryptedArr = messsages.map((message) => {
        const msgParamsUInt8Array = nacl.util.decodeUTF8(message);
        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        const encryptedMessage = nacl.box(
            msgParamsUInt8Array,
            nonce,
            pubKeyUInt8Array,
            ephemeralKeyPair.secretKey,
        );

        return EncryptedMessage({
            nonce: toHexString(nonce),
            ephemPublicKey: toHexString(ephemeralKeyPair.publicKey),
            ciphertext: toHexString(encryptedMessage),
        });
    });

    return encryptedArr;
}
