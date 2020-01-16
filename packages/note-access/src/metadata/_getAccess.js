import { toChecksumAddress } from 'web3-utils';

export default function _getAccess(metadata, address) {
    const { addresses, viewingKeys } = metadata;

    const idx = addresses.findIndex((a) => a === toChecksumAddress(address));
    if (idx < 0) {
        return null;
    }

    return {
        address: addresses[idx],
        viewingKey: viewingKeys[idx],
    };
}
