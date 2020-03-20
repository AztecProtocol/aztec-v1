import BN from 'bn.js';
import {
    formatNumber,
} from '../format';

describe('formatValue', () => {
    it('format token value with specific decimal', () => {
        const decimal = 2;
        expect(formatNumber(0, decimal)).toBe('0');
        expect(formatNumber(1, decimal)).toBe('0.01');
        expect(formatNumber(12, decimal)).toBe('0.12');
        expect(formatNumber(20, decimal)).toBe('0.2');
        expect(formatNumber(100, decimal)).toBe('1');
        expect(formatNumber(123, decimal)).toBe('1.23');
        expect(formatNumber(1000, decimal)).toBe('10');
        expect(formatNumber(1000.00, decimal)).toBe('10');
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

    it('display large decimals properly', () => {
        const decimals = 18;

        expect(formatNumber(1, decimals)).toBe('0.000000000000000001');

        expect(formatNumber(new BN('1234567890987654321'), decimals))
            .toBe('1.234567890987654321');
    });

    it('display large value properly', () => {
        expect(formatNumber(new BN('1000000000000000001'), 2))
            .toBe('10,000,000,000,000,000.01');

        expect(formatNumber('10000000000000000.012345', 3))
            .toBe('10,000,000,000,000,000.012');

        expect(formatNumber(new BN('1234567890987654321'), 0))
            .toBe('1,234,567,890,987,654,321');
    });
});
