import {
    utils,
} from 'web3';
import {
    DYNAMIC_VAR_CONFIG_LENGTH,
    MIN_BYTES_VAR_LENGTH,
} from '~/config/constants';
import config from '~/config/metadata';

const toConfigVar = num => num.toString(16).padStart(DYNAMIC_VAR_CONFIG_LENGTH, '0');
const ensureMinVarSize = (str, len) => str.padStart(Math.max(len || str.length, MIN_BYTES_VAR_LENGTH), '0');

export default function toString(metadataObj) {
    const metadata = {};
    let accumOffset = 0;
    config.forEach(({
        name,
        length,
        startAt,
    }) => {
        let data = '';
        if (metadataObj[name] || (!startAt && length)) {
            const dataArr = Array.isArray(metadataObj[name])
                ? metadataObj[name]
                : [metadataObj[name] || ''];
            data = dataArr
                .map(v => (name === 'addresses' && utils.toChecksumAddress(v)) || v)
                .map(v => `${v}`.replace(/^0x/, ''))
                .map(v => ensureMinVarSize(v, length))
                .join('');
        }

        if (startAt) {
            // a character is half a bytes
            // the total length should always be even
            metadata[startAt] = toConfigVar(accumOffset / 2);

            const numberOfVars = length !== undefined
                ? data.length / Math.max(length, MIN_BYTES_VAR_LENGTH)
                : Math.min(1, data.length);
            data = `${toConfigVar(numberOfVars)}${data}`;
        }

        metadata[name] = data;
        accumOffset += startAt ? data.length : length;
    });

    const str = config
        .map(({ name }) => metadata[name])
        .join('');

    return `0x${str}`;
}
