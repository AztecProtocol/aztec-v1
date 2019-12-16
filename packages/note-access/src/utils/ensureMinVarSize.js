import { padLeft } from 'web3-utils';
import { MIN_BYTES_VAR_LENGTH } from '../config/constants';

export default function ensureMinVarSize(val) {
    const str = `${val}`;
    return padLeft(str.match(/^0x/i) ? str.slice(2) : str, MIN_BYTES_VAR_LENGTH);
}
