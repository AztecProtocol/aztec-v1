import { toChecksumAddress } from 'web3-utils';

export default function _addAccess(metadata, access) {
    const noteAccess = Array.isArray(access) ? access : [access];
    const { addresses, viewingKeys } = metadata;
    const newAddresses = [];
    const newViewingKeys = [];
    noteAccess.forEach(({ address, viewingKey }) => {
        const formattedAddress = toChecksumAddress(address);
        if (addresses.indexOf(formattedAddress) >= 0) return;
        newAddresses.push(formattedAddress);
        newViewingKeys.push(viewingKey);
    });

    return {
        ...metadata,
        addresses: [...addresses, ...newAddresses],
        viewingKeys: [...viewingKeys, ...newViewingKeys],
    };
}
