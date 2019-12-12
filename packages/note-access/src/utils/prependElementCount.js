import { MIN_BYTES_VAR_LENGTH } from '../config/constants';
import to32ByteOffset from './to32ByteOffset';

export default function prependElementCount(data, length) {
    const dataLength = length ? data.length : Math.min(MIN_BYTES_VAR_LENGTH, data.length);
    const count = Math.round(dataLength / Math.max(length || 0, MIN_BYTES_VAR_LENGTH));
    return `${to32ByteOffset(count)}${data}`;
}
