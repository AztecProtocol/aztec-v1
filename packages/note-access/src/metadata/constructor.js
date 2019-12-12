import metadataConfig, {
    START_OFFSET
} from '../config/noteMetaData';
import decodeMetaDataToObject from '../utils/decodeMetaDataToObject';
import _addAccess from './_addAccess';
import _getAccess from './_getAccess';
import toString from './toString';

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
