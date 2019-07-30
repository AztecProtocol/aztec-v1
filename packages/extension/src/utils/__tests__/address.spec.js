import {
    ADDRESS_LENGTH,
} from '~config/constants';
import address from '../address';
import {
    randomId,
} from '../random';

describe('address', () => {
    it('return a well-formatted, lowercase address', () => {
        const validBytes = randomId(ADDRESS_LENGTH);
        const expectedAddress = `0x${validBytes.toLowerCase()}`;

        expect(address(validBytes)).toBe(expectedAddress);

        expect(address(validBytes.toUpperCase())).toBe(expectedAddress);

        expect(address(`0x${validBytes}`)).toBe(expectedAddress);
    });

    it('return empty string if input format is invalid', () => {
        expect(address()).toBe('');
        expect(address('')).toBe('');
        expect(address('0x')).toBe('');
        expect(address('0')).toBe('');

        const validBytes = randomId(ADDRESS_LENGTH);

        expect(address(validBytes.slice(2))).toBe('');

        const invalidChars = [
            'xx',
            validBytes.slice(2),
        ].join('');
        expect(address(invalidChars)).toBe('');

        expect(address(`0x0x${validBytes}`)).toBe('');
    });
});
