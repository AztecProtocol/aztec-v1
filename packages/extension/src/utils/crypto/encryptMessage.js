import {
    errorLog,
} from '~utils/log';
import nacl from './nacl';
import fromHexString from './fromHexString';
import toHexString from './toHexString';
import EncryptedMessage from './EncryptedMessage';

export default function encryptMessage(publicKey, messsage) {
    const ephemeralKeyPair = nacl.box.keyPair();
    let pubKeyUInt8Array;

    try {
        pubKeyUInt8Array = fromHexString(publicKey);
    } catch (error) {
        errorLog('Bad public key', error);
        return null;
    }

    const msgParamsUInt8Array = nacl.util.decodeUTF8(messsage);
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
}
