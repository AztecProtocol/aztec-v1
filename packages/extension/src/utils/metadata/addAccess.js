import constructor from './constructor';
import toString from './toString';

export default function addAccess(metadataStr, access) {
    const noteAccess = Array.isArray(access)
        ? access
        : [access];
    const metadata = constructor(metadataStr);
    const {
        addresses,
        viewingKeys,
    } = metadata;
    const newAddresses = [];
    const newViewingKeys = [];
    noteAccess.forEach(({
        address,
        viewingKey,
    }) => {
        if (addresses.indexOf(address) >= 0) return;
        newAddresses.push(address);
        newViewingKeys.push(viewingKey);
    });

    return toString({
        ...metadata,
        addresses: [
            ...addresses,
            ...newAddresses,
        ],
        viewingKeys: [
            ...viewingKeys,
            ...newViewingKeys,
        ],
    });
}
