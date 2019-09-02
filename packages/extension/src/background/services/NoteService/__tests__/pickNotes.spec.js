import expectErrorResponse from '~helpers/expectErrorResponse';
import pickNotes from '../utils/pickNotes';
import generateSortedValues from '../utils/pickNotes/generateSortedValues';
import pickKeysByValues from '../utils/pickNotes/pickKeysByValues';
import * as pickValues from '../utils/pickNotes/pickValues';

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

describe('pickKeysByValues', () => {
    it('pick note keys from noteValues mapping with selected values', () => {
        const noteValues = {
            0: ['n:0', 'n:1'],
            1: ['n:2', 'n:3', 'n:4'],
            10: ['n:5'],
        };

        expect(pickKeysByValues(noteValues, [0])).toEqual([
            expect.stringMatching(/^n:[0|1]$/),
        ]);

        expect(pickKeysByValues(noteValues, [1, 10])).toEqual([
            expect.stringMatching(/^n:[2|3|4]$/),
            'n:5',
        ]);

        expect(pickKeysByValues(noteValues, [1, 1])).toEqual([
            expect.stringMatching(/^n:[2|3]$/),
            expect.stringMatching(/^n:[3|4]$/),
        ]);

        expect(pickKeysByValues(noteValues, [1, 1, 1])).toEqual([
            'n:2',
            'n:3',
            'n:4',
        ]);
    });
});

describe('pickNotes', () => {
    it('pick notes from noteValues mapping whose sum is equal to or larger than minSum', () => {
        const noteValues = {
            0: ['n:1', 'n:5'],
            1: ['n:2', 'n:3'],
            4: ['n:6'],
            10: ['n:4'],
            12: [],
        };

        expect(pickNotes({
            noteValues,
            minSum: 6,
            numberOfNotes: 0,
        })).toEqual([]);

        expect(pickNotes({
            noteValues,
            minSum: 6,
            numberOfNotes: 1,
        })).toEqual([
            'n:4',
        ]);

        expect(pickNotes({
            noteValues,
            minSum: 13,
            numberOfNotes: 2,
        }).sort()).toEqual([
            'n:4',
            'n:6',
        ].sort());
    });

    it('throw error if there is no note combinations >= min sum', () => {
        expectErrorResponse(() => pickNotes({
            noteValues: {
                0: ['n:0'],
                10: ['n:1'],
                100: ['n:2'],
            },
            minSum: 1000,
            numberOfNotes: 1,
        })).toBe('note.pick.minSum');
    });

    it('return all notes by default if total number of notes is less than numberOfNotes', () => {
        expect(pickNotes({
            noteValues: {
                2: ['n:1'],
                5: ['n:0'],
            },
            minSum: 6,
            numberOfNotes: 3,
        }).sort()).toEqual([
            'n:0',
            'n:1',
        ].sort());
    });

    it('throw error if total number of notes is less than required numberOfNotes and allowLessNumberOfNotes is false', () => {
        expectErrorResponse(() => pickNotes({
            noteValues: {
                2: ['n:1'],
                5: ['n:0'],
            },
            minSum: 1,
            numberOfNotes: 3,
            allowLessNumberOfNotes: false,
        })).toBe('note.pick.count');
    });

    it('skip repeating min values if current sum is not enough', () => {
        const pickValuesSpy = jest.spyOn(pickValues, 'default')
            .mockImplementationOnce(() => [
                1,
                2,
            ]);

        pickNotes({
            noteValues: {
                1: ['n:0', 'n:1', 'n:2', 'n:3', 'n:4'],
                2: ['n:5', 'n:6'],
                3: ['n:7'],
            },
            minSum: 4,
            numberOfNotes: 2,
        });

        expect(pickValuesSpy).toHaveBeenCalledTimes(2);
        expect(pickValuesSpy.mock.calls[1][2]).toEqual(5); // start index

        pickValuesSpy.mockRestore();
    });

    it('select from values that has up to prevNumberOfSelectedMinValues - 1 min values from previous combinations', () => {
        const pickValuesSpy = jest.spyOn(pickValues, 'default')
            .mockImplementationOnce(() => [
                1,
                1,
                1,
            ]);

        pickNotes({
            noteValues: {
                1: ['n:0', 'n:1', 'n:2', 'n:3', 'n:4'],
                2: ['n:5', 'n:6'],
                3: ['n:7'],
            },
            minSum: 4,
            numberOfNotes: 3,
        });

        expect(pickValuesSpy).toHaveBeenCalledTimes(2);
        expect(pickValuesSpy.mock.calls[1][2]).toEqual(3);

        pickValuesSpy.mockRestore();
    });
});
