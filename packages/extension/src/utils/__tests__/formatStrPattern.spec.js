import {
    formatStrPattern,
} from '../format';

let warnings = [];
const consoleSpy = jest.spyOn(console, 'warn')
    .mockImplementation(message => warnings.push(message));

beforeEach(() => {
    consoleSpy.mockClear();
    warnings = [];
});

describe('formatStrPattern', () => {
    it('return a formatted string with pattern and variables', () => {
        expect(formatStrPattern(
            'item_{id}',
            {
                id: '123',
            },
        )).toBe('item_123');
    });

    it('allow multiple variables', () => {
        expect(formatStrPattern(
            'item_{id}_{name}',
            {
                id: '12',
                name: 'abc',
            },
        )).toBe('item_12_abc');
    });

    it('allow duplicated variables', () => {
        expect(formatStrPattern(
            'item_{id}_{name}_{id}',
            {
                id: '12',
                name: 'abc',
            },
        )).toBe('item_12_abc_12');
    });

    it('keep variable if key is not defined in data', () => {
        expect(formatStrPattern(
            'asset_{id}',
            {
                name: 'abc',
            },
        )).toBe('asset_{id}');
        expect(warnings.length).toBe(1);

        expect(formatStrPattern(
            'item_{id}_{name}',
            {
                name: 'abc',
            },
        )).toBe('item_{id}_abc');
        expect(warnings.length).toBe(2);
    });
});
