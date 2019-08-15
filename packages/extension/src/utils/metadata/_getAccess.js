export default function _getAccess(metadata, address) { // eslint-disable-line no-underscore-dangle
    const {
        addresses,
        viewingKeys,
    } = metadata;
    const idx = addresses.findIndex(a => a === address);
    if (idx < 0) {
        return null;
    }

    return {
        address: addresses[idx],
        viewingKey: viewingKeys[idx],
    };
}
