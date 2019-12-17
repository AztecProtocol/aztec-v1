import {
    utils,
} from 'web3';
import config from '~/config/metadata';
import {
    DYNAMIC_VAR_CONFIG_LENGTH,
    MIN_BYTES_VAR_LENGTH,
} from '~/config/constants';
import _addAccess from './_addAccess';
import _getAccess from './_getAccess';
import toString from './toString';

export default function constructor(metadataStr) {
    const metadata = {};
    let start = metadataStr.startsWith('0x')
        ? 2
        : 0;

    const lenVars = config.reduce((accum, {
        startAt,
    }) => {
        if (!startAt) {
            return accum;
        }
        return [...accum, startAt];
    }, []);

    config.forEach(({
        name,
        length,
        startAt,
    }) => {
        const isDynamic = !!startAt;
        const isLenVar = lenVars.indexOf(name) >= 0;

        let numberOfVars = 1;
        if (isDynamic) {
            numberOfVars = parseInt(metadataStr.substr(start, DYNAMIC_VAR_CONFIG_LENGTH), 10);
            start += DYNAMIC_VAR_CONFIG_LENGTH;
        }

        const arr = [];
        for (let i = 0; i < numberOfVars; i += 1) {
            let segLen;
            if (isLenVar) {
                segLen = length;
            } else {
                segLen = length !== undefined
                    ? Math.max(length, MIN_BYTES_VAR_LENGTH)
                    : metadataStr.length - start;
            }
            let val = metadataStr
                .substr(
                    start,
                    segLen,
                );
            if (isLenVar) {
                val = parseInt(val, 16);
            } else if (length) {
                val = val.slice(segLen - (length || 0));
            }
            if (name === 'addresses') {
                arr.push(utils.toChecksumAddress(val));
            } else {
                arr.push(val ? `0x${val}` : '');
            }
            start += segLen;
        }

        const isArrayValue = isDynamic && (length !== undefined);

        metadata[name] = isArrayValue
            ? arr
            : (arr[0] || '');
    });

    const {
        addresses,
        viewingKeys,
    } = metadata;

    return {
        ...metadata,
        addAccess: (access) => {
            const {
                addresses: newAddresses,
                viewingKeys: newViewingKeys,
            } = _addAccess(metadata, access);

            newAddresses.forEach((a, i) => {
                if (addresses.indexOf(a) >= 0) return;

                addresses.push(a);
                viewingKeys.push(newViewingKeys[i]);
            });
        },
        getAccess: address => _getAccess(metadata, address),
        toString: () => toString(metadata),
    };
}
