import {
    padLeft,
    toHex,
} from 'web3-utils';
import {
    MIN_BYTES_VAR_LENGTH,
} from '../src/config/constants';
import decodeMetaDataToObject from '../src/utils/decodeMetaDataToObject';

const ensureMinVarSize = str => padLeft(
    str.match(/^0x/i) ? str.slice(2) : str,
    MIN_BYTES_VAR_LENGTH,
);

describe('decodeMetaDataToObject', () => {
    const config = [
        {
            name: 'food',
            length: 10,
        },
        {
            name: 'fruit',
            length: 5,
        },
        {
            name: 'forest',
        },
    ];

    it('take a string and a config and return a formatted object', () => {
        const inputStr = [
            '0x',
            ensureMinVarSize(toHex(3 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(toHex(4 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(toHex(6 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize('hamburgers'),
            ensureMinVarSize('apple'),
            ensureMinVarSize('banana'),
            ensureMinVarSize('ewjklewjlewjkjfoerejeoree'),
        ].join('');

        expect(decodeMetaDataToObject(inputStr, config)).toEqual({
            food: [
                '0xhamburgers',
            ],
            fruit: [
                '0xapple',
                '0xbanana',
            ],
            forest: '0xewjklewjlewjkjfoerejeoree',
        });
    });
});
