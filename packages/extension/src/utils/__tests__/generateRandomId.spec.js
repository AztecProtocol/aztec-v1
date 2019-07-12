import crypto from '@trust/webcrypto';
import generateRandomId from '../generateRandomId';

let windowCrypto;

beforeAll(() => {
    windowCrypto = window.crypto;
    window.crypto = crypto;
});

afterAll(() => {
    window.crypto = windowCrypto;
});

describe('generateRandomId', () => {
    const base16Pattern = /^[0-9a-f]+$/i;

    it('get an 32 bytes base 16 string by default', () => {
        const id = generateRandomId();
        expect(id.length).toBe(32);
        expect(id).toMatch(base16Pattern);
    });

    it('can generate custom length', () => {
        const shortId = generateRandomId(10);
        expect(shortId.length).toBe(10);
        expect(shortId).toMatch(base16Pattern);

        const longId = generateRandomId(100);
        expect(longId.length).toBe(100);
        expect(longId).toMatch(base16Pattern);
    });

    it('can generate with different radix', () => {
        const base2Id = generateRandomId(10, 2);
        expect(base2Id).toMatch(/^[0-1]+$/i);

        const base10Id = generateRandomId(10, 10);
        expect(base10Id).toMatch(/^[0-9]+$/i);

        const base36Id = generateRandomId(10, 36);
        expect(base36Id).toMatch(/^[0-9a-z]+$/i);
    });
});
