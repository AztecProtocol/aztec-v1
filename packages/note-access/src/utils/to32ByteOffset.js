import { toHex } from 'web3-utils';
import ensureMinVarSize from './ensureMinVarSize';

const to32ByteOffset = (offset) => ensureMinVarSize(`${toHex(offset / 2).slice(2)}`);

export default to32ByteOffset;
