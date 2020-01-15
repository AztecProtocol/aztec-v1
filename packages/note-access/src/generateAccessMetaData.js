import addAccess from './metadata/addAccess';
import encryptedViewingKey from './encryptedViewingKey';

/**
 * @method generateAccessMetaData - grant an Ethereum address view access to a note
 * @param {Array} access - mapping between an Ethereum address and the linked public key. The specified address
 * is being granted access to the note
 * @param {String} noteViewKey - viewing key of the note
 */
export default function generateAccessMetaData(access, noteViewKey) {
    const noteAccess = access.map(({ address, linkedPublicKey }) => {
        const viewingKey = encryptedViewingKey(linkedPublicKey, noteViewKey);
        return {
            address,
            viewingKey: viewingKey.toHexString(),
        };
    });
    return addAccess('', noteAccess);
}
