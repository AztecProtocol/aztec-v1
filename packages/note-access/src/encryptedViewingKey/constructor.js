import { warnLog } from '@aztec/dev-utils';
import { REAL_VIEWING_KEY_LENGTH } from '../config/constants';
import { encryptMessage } from '../crypto';
import decrypt from './decrypt';

/**
 * Encrypt the viewing key of the note with a specific users linkedPublicKey,
 * such that they are able to decrypt with their private key.
 *
 * @method constructor
 * @param {String} linkedPublicKey - publicKey used to encrypt the viewing key, such that the
 * designed user is able to decrypy the viewing key and gain view access to the note.
 *
 * It should be noted that this is not the Ethereum publicKey associated with a user's Ethereum address.
 * Instead, this linkedPublicKey is created when a user registers to use AZTEC
 *
 * @param {String} realViewingKey - viewing key of the note
 *
 * @returns {Object} An object with three methods:
 *      1) export() - encrypt the
 *      2) toHexString() - convert the encrypted viewing key into a hexadecimal string
 *      3) decrypt(privateKey) - decrypt the encrypted viewing key to a hexadecimal string, using the users
 *                               passed privateKey
 */
export default function constructor(linkedPublicKey, realViewingKey) {
    const formattedViewingKey = realViewingKey.replace(/^0x/, '');
    if (formattedViewingKey.length !== REAL_VIEWING_KEY_LENGTH) {
        warnLog('Wrong viewing key size.');
        return null;
    }

    const encrypted = encryptMessage(linkedPublicKey, formattedViewingKey);
    encrypted.decrypt = (privateKey) => decrypt(privateKey, encrypted);

    return encrypted;
}
