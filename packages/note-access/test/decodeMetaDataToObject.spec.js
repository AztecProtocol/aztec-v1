import {
    padLeft,
    toHex,
} from 'web3-utils';
import {
    MIN_BYTES_VAR_LENGTH,
} from '../src/config/constants';
import decodeMetaDataToObject from '../src/utils/decodeMetaDataToObject';
import ensureMinVarSize from '../src/utils/ensureMinVarSize';
import to32ByteOffset from '../src/utils/to32ByteOffset';



describe('decodeMetaDataToObject', () => {
    const config = [
        {
            name: 'food',
            length: 10,
        },
        {
            name: 'fruit',
            length: 6,
        },
        {
            name: 'forest',
        },
    ];

    it('take a string and a config and return a formatted object', () => {
        const inputStr = [
            '0x',
            ensureMinVarSize(to32ByteOffset(3 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(5 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(8 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(1),
            ensureMinVarSize('hamburgers'),
            ensureMinVarSize(2),
            ensureMinVarSize('apples'),
            ensureMinVarSize('banana'),
            ensureMinVarSize(1),
            ensureMinVarSize('ewjklewjlewjkjfoerejeoree'),
        ].join('');

        expect(decodeMetaDataToObject(inputStr, config)).toEqual({
            food: [
                '0xhamburgers',
            ],
            fruit: [
                '0xapples',
                '0xbanana',
            ],
            forest: '0xewjklewjlewjkjfoerejeoree',
        });
    });

    it('can process data with length longer than the MIN_BYTES_VAR_LENGTH', () => {
        const longDataLength = 120;

        const inputStr = [
            '0x',
            ensureMinVarSize(to32ByteOffset(3 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(5 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset((6 * MIN_BYTES_VAR_LENGTH) + (2 * longDataLength))),
            ensureMinVarSize(1),
            ensureMinVarSize('hamburgers'),
            ensureMinVarSize(2),
            'apples'.repeat(longDataLength / 6),
            'banana'.repeat(longDataLength / 6),
            ensureMinVarSize(1),
            ensureMinVarSize('deerrabbitbirdsnakebear'),
        ].join('');
    
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



        expect(decodeMetaDataToObject(inputStr, configWithLongData)).toEqual({
                food: [
                    '0xhamburgers',
                ],
                fruit: [
                    `0x${'apples'.repeat(longDataLength / 6)}`,
                    `0x${'banana'.repeat(longDataLength / 6)}`,
                ],
                forest: '0xdeerrabbitbirdsnakebear',
        });
    });

    it('can process empty data correctly', () => {
        const inputStr = [
            '0x',
            ensureMinVarSize(to32ByteOffset(3 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(4 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(to32ByteOffset(7 * MIN_BYTES_VAR_LENGTH)),
            ensureMinVarSize(0),
            ensureMinVarSize(2),
            ensureMinVarSize('apples'),
            ensureMinVarSize('banana'),
            ensureMinVarSize(1),
            ensureMinVarSize('ewjklewjlewjkjfoerejeoree'),
        ].join('');

        expect(decodeMetaDataToObject(inputStr, config)).toEqual({
                food: [],
                fruit: [
                    '0xapples',
                    '0xbanana',
                ],
                forest: '0xewjklewjlewjkjfoerejeoree',
        });
    });
});
