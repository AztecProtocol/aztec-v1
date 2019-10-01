import {
    utils,
} from 'web3';

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
        const formattedAddress = utils.toChecksumAddress(address);
        if (addresses.indexOf(formattedAddress) >= 0) return;
        newAddresses.push(formattedAddress);
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
