import { DYNAMIC_VAR_CONFIG_LENGTH } from '../config/constants';
import config from '../config/metadata';

const to32ByteOffset = (num) => num.toString(16).padStart(DYNAMIC_VAR_CONFIG_LENGTH, '0');

export default function toString(metadata) {
    let totalDataLength = 0;
    const stringifiedMetadata = config.reduce((acc, type) => {
        const { name, length, startAt: offset } = type;
        acc[name] = type._toString(metadata[name]);

        // Need to find and set the offset of dynamic types.
        if (offset) {
            // A character is half a byte
            acc[offset] = to32ByteOffset(totalDataLength / 2);
        }

        totalDataLength += (offset) ? acc[name].length : length;
        return acc;
    }, {});

    const str = config.map(({ name }) => stringifiedMetadata[name]).join('');

    return `0x${str}`;
}
