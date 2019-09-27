import {
    formatValue,
} from '../asset';


jest.mock('~ui/config/assets', () => ({
    __esModule: true,
    default: {
        bar: {
            decimal: 0,
        },
        foo: {
            decimal: 2,
        },
    },
}));

describe('formatValue', () => {
    it('format asset value with specific decimal', () => {
        expect(formatValue('foo', 0)).toBe('0');
        expect(formatValue('foo', 123)).toBe('123');
        expect(formatValue('foo', 1000)).toBe('1,000');
        expect(formatValue('foo', 1000.00)).toBe('1,000');
        expect(formatValue('foo', 1000.2)).toBe('1,000.2');
        expect(formatValue('foo', 1000.23)).toBe('1,000.23');
        expect(formatValue('foo', 1000.234)).toBe('1,000.23');
    });

    it('format asset value with zero decimal', () => {
        expect(formatValue('bar', 0)).toBe('0');
        expect(formatValue('bar', 123)).toBe('123');
        expect(formatValue('bar', 1000)).toBe('1,000');
        expect(formatValue('bar', 1000.23)).toBe('1,000');
        expect(formatValue('bar', 1000.00)).toBe('1,000');
    });

    it('format asset value with no config', () => {
        expect(formatValue('foobar', 0)).toBe('0');
        expect(formatValue('foobar', 123)).toBe('123');
        expect(formatValue('foobar', 1000)).toBe('1,000');
        expect(formatValue('foobar', 1000.00)).toBe('1,000');
        expect(formatValue('foobar', 1000.2)).toBe('1,000.2');
        expect(formatValue('foobar', 1000.23)).toBe('1,000.23');
        expect(formatValue('foobar', 1000.234)).toBe('1,000.234');
    });
});
