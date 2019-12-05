import { toChecksumAddress } from 'web3-utils';
import config from '../config/metadata';
import { DYNAMIC_VAR_CONFIG_LENGTH, MIN_BYTES_VAR_LENGTH } from '../config/constants';
import _addAccess from './_addAccess';
import _getAccess from './_getAccess';
import toString from './toString';

export default function constructor(metadataStr) {
    const metadata = {};
    let pointer = metadataStr.startsWith('0x') ? 2 : 0;

    config.forEach(({ name, length, startAt: offset }) => {
        const isDynamic = (offset !== undefined);
        const isLengthDefinition = !!config.find(({ startAt }) => startAt === name);

        let numberOfValues = 1;
        if (isDynamic) {
            numberOfValues = parseInt(metadataStr.substr(pointer, DYNAMIC_VAR_CONFIG_LENGTH), 10);
            pointer += DYNAMIC_VAR_CONFIG_LENGTH;
        }

        const isArrayValue = isDynamic && length !== undefined;
        metadata[name] = (isArrayValue) ? [] : '';

        const valueLength = length || metadataStr.length - pointer;
        const slotLength = Math.max(valueLength, MIN_BYTES_VAR_LENGTH)

        const endPointer = (Number.isNaN(numberOfValues)) ? pointer : (numberOfValues * slotLength) + pointer;

        while (pointer < endPointer) {
            let value = metadataStr.substr(pointer, slotLength);
            if (isLengthDefinition) {
                value = parseInt(value, 16);
            }

            if (name === 'addresses') {
                value = value.slice(slotLength - valueLength);
                value = toChecksumAddress(value);
            } else {
                value = (value) ? `0x${value}` : '';
            }

            if (isArrayValue) {
                metadata[name].push(value);
            } else {
                metadata[name] = value;
            }

            pointer += slotLength;
        }
    });

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
