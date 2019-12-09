import {
    padLeft,
    toHex,
} from 'web3-utils';
import {
    MIN_BYTES_VAR_LENGTH,
} from '../src/config/constants';
import encodeMetaDataToString from '../src/utils/encodeMetaDataToString';

const ensureMinVarSize = str => padLeft(
    str.match(/^0x/i) ? str.slice(2) : str,
    MIN_BYTES_VAR_LENGTH,
);

describe('encodeMetaDataToString', () => {
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
        const inputObj = {
            food: [
                '0xhamburgers',
            ],
            fruit: [
                '0xapple',
                '0xbanana',
            ],
            forest: '0xewjklewjlewjkjfoerejeoree',
        };

        const expectedStr = [
            '0x',
            ensureMinVarSize(toHex(3 * MIN_BYTES_VAR_LENGTH / 2)),
            ensureMinVarSize(toHex(4 * MIN_BYTES_VAR_LENGTH / 2)),
            ensureMinVarSize(toHex(6 * MIN_BYTES_VAR_LENGTH / 2)),
            ensureMinVarSize('hamburgers'),
            ensureMinVarSize('apple'),
            ensureMinVarSize('banana'),
            ensureMinVarSize('ewjklewjlewjkjfoerejeoree'),
        ].join('');

        expect(encodeMetaDataToString(inputObj, config)).toEqual(expectedStr);

        const inputObj2 = {
            food: [],
            fruit: [],
            forest: '',
        };

        expect(encodeMetaDataToString(inputObj2, config)).toEqual('');
    });

    it('take a 3rd parameter as startOffset', () => {
        const inputObj = {
            food: [
                '0xhamburgers',
            ],
            fruit: [
                '0xapple',
                '0xbanana',
            ],
            forest: '0xewjklewjlewjkjfoerejeoree',
        };

        const startOffset = 100;

        const expectedStr = [
            '0x',
            ensureMinVarSize(toHex((startOffset + (3 * MIN_BYTES_VAR_LENGTH)) / 2)),
            ensureMinVarSize(toHex((startOffset + (4 * MIN_BYTES_VAR_LENGTH)) / 2)),
            ensureMinVarSize(toHex((startOffset + (6 * MIN_BYTES_VAR_LENGTH)) / 2)),
            ensureMinVarSize('hamburgers'),
            ensureMinVarSize('apple'),
            ensureMinVarSize('banana'),
            ensureMinVarSize('ewjklewjlewjkjfoerejeoree'),
        ].join('');

        expect(encodeMetaDataToString(inputObj, config, startOffset)).toEqual(expectedStr);
    });

    it('take a string and a config and return a formatted object', () => {
        const configWithToString = [
            {
                name: 'food',
                length: 10,
                _toString: str => str.toUpperCase(),
            },
            {
                name: 'fruit',
                length: 5,
            },
            {
                name: 'forest',
            },
        ];

        const inputObj = {
            food: [
                '0xhamburgers',
            ],
            fruit: [
                '0xapple',
                '0xbanana',
            ],
            forest: '0xewjklewjlewjkjfoerejeoree',
        };
        const expectedStr = [
            '0x',
            ensureMinVarSize(toHex(3 * MIN_BYTES_VAR_LENGTH / 2)),
            ensureMinVarSize(toHex(4 * MIN_BYTES_VAR_LENGTH / 2)),
            ensureMinVarSize(toHex(6 * MIN_BYTES_VAR_LENGTH / 2)),
            ensureMinVarSize('hamburgers'.toUpperCase()),
            ensureMinVarSize('apple'),
            ensureMinVarSize('banana'),
            ensureMinVarSize('ewjklewjlewjkjfoerejeoree'),
        ].join('');

        expect(encodeMetaDataToString(inputObj, configWithToString)).toEqual(expectedStr);
    });
});
