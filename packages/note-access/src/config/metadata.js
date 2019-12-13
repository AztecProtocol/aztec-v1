/* eslint-disable func-names */
/* eslint-disable object-shorthand */
import { toChecksumAddress } from 'web3-utils';
import {
    METADATA_AZTEC_DATA_LENGTH,
    DYNAMIC_VAR_CONFIG_LENGTH,
    ADDRESS_LENGTH,
    VIEWING_KEY_LENGTH,
    MIN_BYTES_VAR_LENGTH,
} from './constants';

const ensureMinVarSize = (str, len) => str.padStart(Math.max(len || str.length, MIN_BYTES_VAR_LENGTH), '0');
const to32ByteOffset = (num) => num.toString(16).padStart(DYNAMIC_VAR_CONFIG_LENGTH, '0');

function baseToString(value) {
    const { length, startAt } = this || {};
    const isEmptyObject = !value && startAt !== undefined;
    if (isEmptyObject) return '';
    const removeHex = `${value || ''}`.replace(/^0x/, '');
    return ensureMinVarSize(removeHex, length);
}

function prependElementCount(data, length) {
    const dataLength = length ? data.length : Math.min(MIN_BYTES_VAR_LENGTH, data.length);
    const count = Math.round(dataLength / Math.max(length || 0, MIN_BYTES_VAR_LENGTH));
    return `${to32ByteOffset(count)}${data}`;
}

export default [
    {
        name: 'aztecData',
        length: METADATA_AZTEC_DATA_LENGTH,
        _toString: baseToString,
    },
    {
        name: 'addressesOffset',
        length: DYNAMIC_VAR_CONFIG_LENGTH,
        _toString: baseToString,
    },
    {
        name: 'viewingKeysOffset',
        length: DYNAMIC_VAR_CONFIG_LENGTH,
        _toString: baseToString,
    },
    {
        name: 'appDataOffset',
        length: DYNAMIC_VAR_CONFIG_LENGTH,
        _toString: baseToString,
    },
    {
        name: 'addresses',
        length: ADDRESS_LENGTH,
        startAt: 'addressesOffset',
        _toString: function(values = []) {
            const self = this;
            const data = values
                .map(toChecksumAddress)
                .map(baseToString.bind(self))
                .join('');
            return prependElementCount(data, self.length);
        },
    },
    {
        name: 'viewingKeys',
        length: VIEWING_KEY_LENGTH,
        startAt: 'viewingKeysOffset',
        _toString: function(values = []) {
            const self = this;
            const data = values.map((value) => baseToString.call(self, value)).join('');
            return prependElementCount(data, self.length);
        },
    },
    {
        name: 'appData',
        startAt: 'appDataOffset',
        _toString: function(value) {
            const self = this;
            return prependElementCount(baseToString.call(self, value));
        },
    },
];
