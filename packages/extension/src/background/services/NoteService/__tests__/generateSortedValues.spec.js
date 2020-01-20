import generateSortedValues from '../utils/generateSortedValues';

describe('generateSortedValues', () => {
    it('return an array of sorted values from input noteValues mapping', () => {
        const noteValues = {
            4: ['n:6'],
            1: ['n:2', 'n:3'],
            10: ['n:4'],
            12: [],
            0: ['n:1', 'n:5'],
        };
        const values = generateSortedValues(noteValues);
        expect(values).toEqual([
            0,
            0,
            1,
            1,
            4,
            10,
        ]);
    });
});
