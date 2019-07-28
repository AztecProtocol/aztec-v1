import {
    randomInt,
    randomSumArray,
    randomId,
} from '../random';

describe('randomInt', () => {
    it('generate a random number between min(inclusive) and max(inclusive)', () => {
        const rand0 = randomInt(0, 10);
        expect(rand0 >= 0).toBe(true);
        expect(rand0 <= 10).toBe(true);

        const rand1 = randomInt(31, 32);
        expect(rand1 >= 31).toBe(true);
        expect(rand1 <= 32).toBe(true);

        const rand2 = randomInt(10, 10);
        expect(rand2).toBe(10);
    });

    it('can change order of inputs', () => {
        const rand0 = randomInt(10, 0);
        expect(rand0 >= 0).toBe(true);
        expect(rand0 <= 10).toBe(true);
    });

    it('allow negative values', () => {
        const rand0 = randomInt(-14, -7);
        expect(rand0 >= -14).toBe(true);
        expect(rand0 <= -7).toBe(true);

        const rand1 = randomInt(-10, -10);
        expect(rand1).toBe(-10);

        const rand2 = randomInt(-3, 5);
        expect(rand2 >= -3).toBe(true);
        expect(rand2 <= 5).toBe(true);
    });

    it('set another value to be 0 if only one value is provided', () => {
        const rand0 = randomInt(10);
        expect(rand0 >= 0).toBe(true);
        expect(rand0 <= 10).toBe(true);

        const rand1 = randomInt(-2);
        expect(rand1 >= -2).toBe(true);
        expect(rand1 <= 0).toBe(true);

        const rand2 = randomInt(0);
        expect(rand2).toBe(0);
    });
});

describe('randomSumArray', () => {
    it('generate an array of intergers with specified sum and array size', () => {
        const sum = 15;
        const numberOfValues = 3;
        const result = randomSumArray(sum, numberOfValues);

        expect(result.length).toBe(numberOfValues);

        const calSum = result.reduce((accum, v) => accum + v, 0);
        expect(calSum).toBe(sum);
    });
});

describe('randomId', () => {
    const base16Pattern = /^[0-9a-f]+$/i;

    it('get an 32 bytes base 16 string by default', () => {
        const id = randomId();
        expect(id.length).toBe(32);
        expect(id).toMatch(base16Pattern);
    });

    it('can generate custom length', () => {
        const shortId = randomId(10);
        expect(shortId.length).toBe(10);
        expect(shortId).toMatch(base16Pattern);

        const longId = randomId(100);
        expect(longId.length).toBe(100);
        expect(longId).toMatch(base16Pattern);
    });

    it('can generate with different radix', () => {
        const base2Id = randomId(10, 2);
        expect(base2Id).toMatch(/^[0-1]+$/i);

        const base10Id = randomId(10, 10);
        expect(base10Id).toMatch(/^[0-9]+$/i);

        const base36Id = randomId(10, 36);
        expect(base36Id).toMatch(/^[0-9a-z]+$/i);
    });
});
