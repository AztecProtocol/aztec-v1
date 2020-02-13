import dataKey, {
    getPrefix,
} from '../dataKey';

let warnings = [];
const consoleSpy = jest.spyOn(console, 'warn')
    .mockImplementation(message => warnings.push(message));

beforeEach(() => {
    consoleSpy.mockClear();
    warnings = [];
});

describe('dataKey', () => {
    it('return a key for storage using pattern defined in config/dataKey', () => {
        expect(dataKey(
            'note',
            {
                count: 123,
            },
        )).toBe('n:123');

        expect(dataKey(
            'note',
            {
                count: 123,
                id: 'abc',
                address: '0xqaz',

            },
        )).toBe('n:123');
    });

    it('accept custom config object', () => {
        expect(dataKey(
            'asset',
            {
                id: '123',
            },
            {
                asset: 'asset_id_{id}',
            },
        )).toBe('asset_id_123');

        expect(dataKey(
            'test',
            {
                text: 'foo',
            },
            {
                test: 'bar_{text}',
            },
        )).toBe('bar_foo');
    });

    it('accept custom config string as first parameter', () => {
        expect(dataKey(
            'item_{id}',
            {
                id: '123',
            },
        )).toBe('item_123');
    });

    it('allow multiple variables', () => {
        expect(dataKey(
            'item_{id}_{name}',
            {
                id: '12',
                name: 'abc',
            },
        )).toBe('item_12_abc');
    });

    it('allow duplicated variables', () => {
        expect(dataKey(
            'item_{id}_{name}_{id}',
            {
                id: '12',
                name: 'abc',
            },
        )).toBe('item_12_abc_12');
    });

    it('return empty string if pattern is not defined properly', () => {
        expect(dataKey(
            'whatever',
            {
                name: 'abc',
                whatever: 'val',
            },
        )).toBe('');
        expect(warnings.length).toBe(1);
    });

    it('keep variable if key is not defined in data', () => {
        expect(dataKey(
            'note',
            {
                name: 'abc',
            },
        )).toBe('n:{count}');
        expect(warnings.length).toBe(1);

        expect(dataKey(
            'item_{id}_{name}',
            {
                name: 'abc',
            },
        )).toBe('item_{id}_abc');
        expect(warnings.length).toBe(2);
    });
});

describe('getPrefix', () => {
    it('get prefix of a dataKey from pattern defined in config/dataKey', () => {
        expect(getPrefix('note')).toBe('n:');
    });

    it('get prefix from a custom pattern', () => {
        expect(getPrefix('note{noteId}')).toBe('note');
        expect(getPrefix('asset:{userId}{assetId}')).toBe('asset:');
    });

    it('cannot get prefix from a pattern with fixed symbol in the middle', () => {
        expect(getPrefix('note{noteId}:{count}')).toBe('');
        expect(getPrefix('asset:{userId}a')).toBe('');
    });

    it('cannot get prefix from a pattern without fixed symbol at the beginning', () => {
        expect(getPrefix('{noteId}a{count}')).toBe('');
        expect(getPrefix('{noteId}a')).toBe('');
    });
});
