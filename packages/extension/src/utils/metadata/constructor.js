import config from '~config/metadata';
import {
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
} from '~config/constants';

export default function constructor(metadataStr) {
    const metadata = {};
    let start = metadataStr.startsWith('0x')
        ? 2
        : 0;
    config.forEach(({
        name,
        length,
    }) => {
        const len = typeof length === 'number'
            ? length
            : parseInt(metadata[length], 10);
        metadata[name] = metadataStr.substr(start, len);
        start += len;
    });

    const {
        addresses: addressStr,
        viewingKeys: viewingKeysStr,
    } = metadata;
    const addresses = [];
    const viewingKeys = [];
    const numberOfAccounts = addressStr.length / ADDRESS_LENGTH;
    for (let i = 0; i < numberOfAccounts; i += 1) {
        addresses.push(addressStr.substr(ADDRESS_LENGTH * i, ADDRESS_LENGTH));
        viewingKeys.push(viewingKeysStr.substr(VIEWING_KEY_LENGTH * i, VIEWING_KEY_LENGTH));
    }

    return {
        ...metadata,
        addresses,
        viewingKeys,
    };
}
