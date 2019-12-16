import metadataConfig, { START_OFFSET } from '../config/metaData';
import decodeMetaDataToObject from '../utils/decodeMetaDataToObject';
import _addAccess from './_addAccess';
import _getAccess from './_getAccess';
import toString from './toString';

/**
 * Construct a metaData object, with key methods to manipulate the metaData such as by adding
 * view key access for a third party and converting the metaData object to a string
 *
 * @method constructor
 * @param {String} metaDataStr - metaData in string form, the form as it is stored on
 * the AZTEC note
 * @returns {Object} metaData object together with associated method for commonly performed
 * actions
 */
export default function constructor(metaDataStr) {
    const metadata = decodeMetaDataToObject(metaDataStr, metadataConfig, START_OFFSET);

    const { addresses, viewingKeys } = metadata;

    return {
        ...metadata,
        addAccess: (access) => {
            const { addresses: newAddresses, viewingKeys: newViewingKeys } = _addAccess(metadata, access);

            newAddresses.forEach((a, i) => {
                if (addresses.indexOf(a) >= 0) return;

                addresses.push(a);
                viewingKeys.push(newViewingKeys[i]);
            });
        },
        getAccess: (address) => _getAccess(metadata, address),
        toString: () => toString(metadata),
    };
}
