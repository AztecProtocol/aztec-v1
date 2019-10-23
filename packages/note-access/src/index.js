import addAccess from './metadata/addAccess';
import METADATA_AZTEC_DATA_LENGTH from './config/constants';
import encryptedViewingKey from './encryptedViewingKey';


/**
 * Grant an Ethereum address access to the viewing key of a note
 * 
 * @param {Object} access mapping between an Ethereum address and the linked publickey
 * @returns {string} customData - customMetaData which will grant the specified Ethereum address(s)
 * access to a note
 */
export default function grantNoteAccess(access) {
    let accessUsers = access;
    if (typeof access === 'string') {
        accessUsers = [
            {
                address: owner,
                linkedPublicKey: access,
            },
        ];
    } else if (!Array.isArray(access)) {
        accessUsers = [access];
    }
    const realViewingKey = this.getView();
    const metaDataAccess = accessUsers.map(({ address, linkedPublicKey }) => {
        return {
            address,
            viewingKey: encryptedViewingKey(linkedPublicKey, realViewingKey).toHexString(),
        };
    });
    const newMetaData = addAccess('', metaDataAccess);
    return newMetaData.slice(METADATA_AZTEC_DATA_LENGTH);
}
