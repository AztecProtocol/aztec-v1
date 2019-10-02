import formatNumber from '../formatNumber';

describe('formatValue', () => {
    it('format token value with specific decimal', () => {
        const decimal = 2;
        expect(formatNumber(0, decimal)).toBe('0');
        expect(formatNumber(123, decimal)).toBe('123');
        expect(formatNumber(1000, decimal)).toBe('1,000');
        expect(formatNumber(1000.00, decimal)).toBe('1,000');
        expect(formatNumber(1000.2, decimal)).toBe('1,000.2');
        expect(formatNumber(1000.23, decimal)).toBe('1,000.23');
        expect(formatNumber(1000.234, decimal)).toBe('1,000.23');
    });

    it('format token value with zero decimal', () => {
        const decimal = 0;
        expect(formatNumber(0, decimal)).toBe('0');
        expect(formatNumber(123, decimal)).toBe('123');
        expect(formatNumber(1000, decimal)).toBe('1,000');
        expect(formatNumber(1000.23, decimal)).toBe('1,000');
        expect(formatNumber(1000.00, decimal)).toBe('1,000');
    });

    it('format token value with undefined decimal', () => {
        expect(formatNumber(0)).toBe('0');
        expect(formatNumber(123)).toBe('123');
        expect(formatNumber(1000)).toBe('1,000');
        expect(formatNumber(1000.00)).toBe('1,000');
        expect(formatNumber(1000.2)).toBe('1,000.2');
        expect(formatNumber(1000.23)).toBe('1,000.23');
        expect(formatNumber(1000.234)).toBe('1,000.234');
    });
});
