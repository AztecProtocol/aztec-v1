import { MIN_BYTES_VAR_LENGTH } from '../src/config/constants';
import ensureMinVarSize from '../src/utils/ensureMinVarSize';
import to32ByteOffset from '../src/utils/to32ByteOffset';
import encodeMetaDataToString from '../src/utils/encodeMetaDataToString';

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
            food: ['0xhamburgers'],
            fruit: ['0xapple', '0xbanana'],
            forest: '0xdeerrabbitbirdsnakebear',
        };

        const expectedStr = [
            '0x',
            ensureMinVarSize(to32ByteOffset(3 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(5 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(8 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(1),
            ensureMinVarSize('hamburgers'),
            ensureMinVarSize(2),
            ensureMinVarSize('apple'),
            ensureMinVarSize('banana'),
            ensureMinVarSize(1),
            ensureMinVarSize('deerrabbitbirdsnakebear'),
        ].join('');

        expect(encodeMetaDataToString(inputObj, config)).toEqual(expectedStr);
    });

    it('can process data with length longer than the MIN_BYTES_VAR_LENGTH', () => {
        const longDataLength = 120;
        const configWithLongData = [
            {
                name: 'food',
                length: 10,
            },
            {
                name: 'fruit',
                length: longDataLength,
            },
            {
                name: 'forest',
            },
        ];

        const inputObj = {
            food: ['0xhamburgers'],
            fruit: [`0x${'apple'.repeat(longDataLength / 5)}`, `0x${'banana'.repeat(longDataLength / 6)}`],
            forest: '0xdeerrabbitbirdsnakebear',
        };

        const expectedStr = [
            '0x',
            ensureMinVarSize(to32ByteOffset(3 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(5 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(6 * MIN_BYTES_VAR_LENGTH + 2 * longDataLength)),
            ensureMinVarSize(1),
            ensureMinVarSize('hamburgers'),
            ensureMinVarSize(2),
            'apple'.repeat(longDataLength / 5),
            'banana'.repeat(longDataLength / 6),
            ensureMinVarSize(1),
            ensureMinVarSize('deerrabbitbirdsnakebear'),
        ].join('');

        expect(encodeMetaDataToString(inputObj, configWithLongData)).toEqual(expectedStr);
    });

    it('process empty data properly', () => {
        const inputObjWithEmptyArray = {
            food: [],
            fruit: ['0xapple', '0xbanana'],
            forest: '',
        };

        const inputObjWithUndefinedData = {
            fruit: ['0xapple', '0xbanana'],
        };

        const expectedStr = [
            '0x',
            ensureMinVarSize(to32ByteOffset(3 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(4 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(7 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(0),
            ensureMinVarSize(2),
            ensureMinVarSize('apple'),
            ensureMinVarSize('banana'),
            ensureMinVarSize(0),
        ].join('');

        expect(encodeMetaDataToString(inputObjWithEmptyArray, config)).toEqual(expectedStr);
        expect(encodeMetaDataToString(inputObjWithUndefinedData, config)).toEqual(expectedStr);
    });

    it('return empty string if all data are empty', () => {
        const inputObj = {
            food: [],
            fruit: [],
            forest: '',
        };

        expect(encodeMetaDataToString(inputObj, config)).toEqual('');
    });

    it('take a 3rd parameter as startOffset', () => {
        const inputObj = {
            food: ['0xhamburgers'],
            fruit: ['0xapple', '0xbanana'],
            forest: '0xdeerrabbitbirdsnakebear',
        };

        const startOffset = 100;

        const expectedStr = [
            '0x',
            ensureMinVarSize(to32ByteOffset(startOffset + 3 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(startOffset + 5 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(startOffset + 8 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(1),
            ensureMinVarSize('hamburgers'),
            ensureMinVarSize(2),
            ensureMinVarSize('apple'),
            ensureMinVarSize('banana'),
            ensureMinVarSize(1),
            ensureMinVarSize('deerrabbitbirdsnakebear'),
        ].join('');

        expect(encodeMetaDataToString(inputObj, config, startOffset)).toEqual(expectedStr);
    });

    it('use custom _toString function in config to format data', () => {
        const configWithToString = [
            {
                name: 'food',
                length: 10,
                _toString: (str) => str.toUpperCase(),
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
            food: ['0xhamburgers'],
            fruit: ['0xapple', '0xbanana'],
            forest: '0xdeerrabbitbirdsnakebear',
        };
        const expectedStr = [
            '0x',
            ensureMinVarSize(to32ByteOffset(3 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(5 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(8 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(1),
            ensureMinVarSize('HAMBURGERS'),
            ensureMinVarSize(2),
            ensureMinVarSize('apple'),
            ensureMinVarSize('banana'),
            ensureMinVarSize(1),
            ensureMinVarSize('deerrabbitbirdsnakebear'),
        ].join('');

        expect(encodeMetaDataToString(inputObj, configWithToString)).toEqual(expectedStr);
    });
});
