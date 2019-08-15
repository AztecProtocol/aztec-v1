export default function _addAccess(metadata, access) { // eslint-disable-line no-underscore-dangle
    const noteAccess = Array.isArray(access)
        ? access
        : [access];
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

    return {
        ...metadata,
        addresses: [
            ...addresses,
            ...newAddresses,
        ],
        viewingKeys: [
            ...viewingKeys,
            ...newViewingKeys,
        ],
    };
}
