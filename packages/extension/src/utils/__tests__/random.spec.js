import {
    randomInt,
    randomInts,
    randomSumArray,
    randomId,
    makeRand,
    makeRandomInt,
    makeRandomInts,
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

    it('select a number from 0 to 2 ** 32 if no values are provided', () => {
        const rand = randomInt();
        expect(rand >= 0).toBe(true);
        expect(rand <= 2 ** 32).toBe(true);
    });
});

describe('randomInts', () => {
    it('generate an array of sorted integers in specified range', () => {
        const rands0 = randomInts(2, 0, 10);
        expect(rands0.every(v => v >= 0 && v <= 10)).toBe(true);

        const rands1 = randomInts(2, 0, 2);
        expect(rands1.every(v => v >= 0 && v <= 2)).toBe(true);

        const rands2 = randomInts(2, 0, 1);
        expect(rands2).toEqual([0, 1]);

        const rands3 = randomInts(3, 14, 16);
        expect(rands3).toEqual([14, 15, 16]);
    });

    it('return all valid values if required number is larger than range', () => {
        const rands0 = randomInts(4, 1, 1);
        expect(rands0).toEqual([1]);

        const rands1 = randomInts(4, 2, 3);
        expect(rands1).toEqual([2, 3]);
    });

    it('accept negative range', () => {
        const rands0 = randomInts(2, -10, -5);
        expect(rands0.every(v => v >= -10 && v <= -5)).toBe(true);

        const rands1 = randomInts(4, -12, -11);
        expect(rands1).toEqual([-12, -11]);
    });

    it('the order of start and end can be switch', () => {
        const rands0 = randomInts(3, 15, 13);
        expect(rands0).toEqual([13, 14, 15]);

        const rands1 = randomInts(3, -5, -7);
        expect(rands1).toEqual([-7, -6, -5]);
    });

    it('set another side of the range to be 0 if only one value is provided', () => {
        const rands0 = randomInts(3, 2);
        expect(rands0).toEqual([0, 1, 2]);

        const rands1 = randomInts(3, -2);
        expect(rands1).toEqual([-2, -1, 0]);
    });

    it('select numbers from 0 to 2 ** 32 if no boundaries are provided', () => {
        const rands = randomInts(10);
        expect(rands.every(v => v >= 0 && v <= 2 ** 32)).toBe(true);
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

describe('makeRand', () => {
    it('return a custom random function from a seed', () => {
        const seed = 'pikachu';
        const rand = makeRand(seed);
        const numberOfValues = 100;
        const randomValues = Array.from({ length: numberOfValues }, () => rand());

        expect([...new Set(randomValues)].length).toBe(numberOfValues);
        expect(randomValues.every(val => val >= 0 && val < 1)).toBe(true);
    });

    it('random functions with the same seed always return the same numbers in order', () => {
        const seed = 'pikachu';
        const randA = makeRand(seed);
        const randB = makeRand(seed);

        expect(randA()).toBe(randB());
        expect(randA()).toBe(randB());
    });
});

describe('apply custom rand functions', () => {
    it('allow randomInt to use custom function', () => {
        const rand = () => 0.5;

        const customRandomInt = makeRandomInt(rand);
        expect(customRandomInt(0, 10)).toBe(5);
        expect(customRandomInt(0, 20)).toBe(10);

        expect(randomInt(0, 10, rand)).toBe(5);
        expect(randomInt(10, null, rand)).toBe(5);
    });

    it('allow randomInts to use custom function', () => {
        const rand = () => 0.5;

        const customRandomInts = makeRandomInts(rand);
        expect(customRandomInts(3, 0, 15)).toEqual([4, 8, 12]);

        expect(randomInts(3, 0, 15, rand)).toEqual([4, 8, 12]);
        expect(randomInts(3, 15, null, rand)).toEqual([4, 8, 12]);
    });
});
