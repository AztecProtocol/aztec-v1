import formatHash from '../formatHash';

describe('formatHash', () => {
    it('return a string with given prefix and suffix lengths', () => {
        const str = '0123456789';
        expect(formatHash(str, 1, 2)).toBe('0...89');
        expect(formatHash(str, 2, 1)).toBe('01...9');
        expect(formatHash(str, 5, 2)).toBe('01234...89');
    });

    it('accept empty prefix and/or suffix', () => {
        const str = '0123456789';
        expect(formatHash(str)).toBe('...');
        expect(formatHash(str, 4, 0)).toBe('0123...');
        expect(formatHash(str, 0, 3)).toBe('...789');
        expect(formatHash(str, 0, 0)).toBe('...');
    });

    it('return original string if the sum of prefix and suffix lengths exceeds string length', () => {
        const str = '0123456789';
        expect(formatHash(str, 4, 6)).toBe(str);
        expect(formatHash(str, 5, 6)).toBe(str);
        expect(formatHash(str, 10, 0)).toBe(str);
    });
});
