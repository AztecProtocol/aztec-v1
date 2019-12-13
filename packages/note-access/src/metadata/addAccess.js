import constructor from './constructor';
import toString from './toString';
import _addAccess from './_addAccess';

/**
 * Generate the new metaData for a note, which contains the encrypted viewing keys to grant addresses
 * specified in 'access' view access to a note
 *
 * @method addAccess
 * @param {String} prevMetadata - any previously existing metaData, to which additional metaData
 * is being added
 * @param {Array} access - array of objects, where each object contains an Ethereum address and the
 * linkedPublicKey
 * @returns {String} newMetaData, including both the previous and additional metaData
 */
export default function addAccess(prevMetadata, access) {
    const isString = typeof prevMetadata === 'string';
    const metadata = isString ? constructor(prevMetadata) : prevMetadata;
    const newMetaData = _addAccess(metadata, access);
    return isString ? toString(newMetaData) : newMetaData;
}
