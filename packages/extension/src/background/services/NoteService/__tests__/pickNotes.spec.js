import expectErrorResponse from '~testHelpers/expectErrorResponse';
import {
    NUMBER_OF_INPUT_NOTES,
} from '~/config/settings';
import generateSortedValues from '../utils/generateSortedValues';
import pickNotes from '../utils/pickNotes';
import getStartIndex from '../utils/pickNotes/getStartIndex';
import pickKeysByValues from '../utils/pickNotes/pickKeysByValues';
import excludeValues from '../utils/pickNotes/excludeValues';
import excludeNoteKeys from '../utils/pickNotes/excludeNoteKeys';
import * as validate from '../utils/pickNotes/validate';
import * as pickValues from '../utils/pickNotes/pickValues';

describe('getStartIndex', () => {
    it('return a start index that will guarantee at least one valid combination from that point', () => {
        const sortedValues = [0, 1, 2, 3, 4, 5, 6];
        expect(getStartIndex(sortedValues, 4, 1)).toBe(4);
        expect(getStartIndex(sortedValues, 4, 2)).toBe(0);
        expect(getStartIndex(sortedValues, 4, 3)).toBe(0);
        expect(getStartIndex(sortedValues, 9, 2)).toBe(3);
        expect(getStartIndex(sortedValues, 9, 3)).toBe(0);
    });

    it('properly process repeating values', () => {
        const sortedValues = [0, 1, 1, 1, 1, 1, 2, 3, 4, 5];
        expect(getStartIndex(sortedValues, 3, 1)).toBe(7);
        expect(getStartIndex(sortedValues, 3, 2)).toBe(0);
        expect(getStartIndex(sortedValues, 6, 2)).toBe(1);
        expect(getStartIndex(sortedValues, 7, 2)).toBe(6);
    });

    it('return -1 if there is no valid combination in it', () => {
        const sortedValues = [0, 1, 2, 3, 4, 5, 6];
        expect(getStartIndex(sortedValues, 7, 1)).toBe(-1);
        expect(getStartIndex(sortedValues, 12, 2)).toBe(-1);
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

describe('excludeValues', () => {
    const values = [
        0,
        0,
        1,
        2,
        3,
        3,
        6,
    ];

    it('exclude values of notes from a value array', () => {
        const excludes0 = [
            0,
            1,
            2,
        ];
        expect(excludeValues(values, excludes0)).toEqual([
            0,
            3,
            3,
            6,
        ]);

        const excludes1 = [
            0,
            2,
            19,
        ];
        expect(excludeValues(values, excludes1)).toEqual([
            0,
            1,
            3,
            3,
            6,
        ]);

        const excludes2 = [
            0,
            0,
            0,
            0,
        ];
        expect(excludeValues(values, excludes2)).toEqual([
            1,
            2,
            3,
            3,
            6,
        ]);
    });

    it('returns original values if excludes is empty', () => {
        expect(excludeValues(values, null)).toBe(values);
        expect(excludeValues(values, [])).toBe(values);
    });
});

describe('excludeNoteKeys', () => {
    const noteValues = {
        0: ['n:0', 'n:1'],
        1: ['n:2', 'n:3', 'n:4'],
        3: ['n:5'],
    };

    it('exclude note keys from noteValues object', () => {
        const excludes0 = [
            {
                value: 0,
                key: 'n:1',
            },
            {
                value: 1,
                key: 'n:2',
            },
            {
                value: 3,
                key: 'n:5',
            },
        ];
        expect(excludeNoteKeys(noteValues, excludes0)).toEqual({
            0: ['n:0'],
            1: ['n:3', 'n:4'],
            3: [],
        });

        const excludes1 = [
            {
                value: 0,
                key: 'n:0',
            },
            {
                value: 1,
                key: 'n:12',
            },
            {
                value: 3,
                key: 'n:15',
            },
        ];
        expect(excludeNoteKeys(noteValues, excludes1)).toEqual({
            0: ['n:1'],
            1: ['n:2', 'n:3', 'n:4'],
            3: ['n:5'],
        });

        const excludes2 = [
            {
                value: 0,
                key: 'n:13',
            },
            {
                value: 0,
                key: 'n:13',
            },
            {
                value: 0,
                key: 'n:17',
            },
        ];
        expect(excludeNoteKeys(noteValues, excludes2)).toEqual({
            0: ['n:0', 'n:1'],
            1: ['n:2', 'n:3', 'n:4'],
            3: ['n:5'],
        });
    });

    it('returns original noteValues if excludes is empty', () => {
        expect(excludeValues(noteValues, null)).toBe(noteValues);
        expect(excludeValues(noteValues, [])).toBe(noteValues);
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
        const sortedValues = generateSortedValues(noteValues);

        expect(pickNotes({
            noteValues,
            sortedValues,
            minSum: 6,
            numberOfNotes: 0,
        })).toEqual([]);

        expect(pickNotes({
            noteValues,
            sortedValues,
            minSum: 6,
            numberOfNotes: 1,
        })).toEqual([
            {
                key: 'n:4',
                value: 10,
            },
        ]);

        expect(pickNotes({
            noteValues,
            sortedValues,
            minSum: 13,
            numberOfNotes: 2,
        })).toEqual([
            {
                key: 'n:6',
                value: 4,
            },
            {
                key: 'n:4',
                value: 10,
            },
        ]);
    });

    it('pick random number of notes if numberOfNotes is not undefined', () => {
        const validateSpy = jest.spyOn(validate, 'default');

        const noteValues = {
            0: ['n:1'],
            1: ['n:2'],
            2: ['n:3'],
            4: ['n:6'],
            8: ['n:4'],
        };
        const sortedValues = generateSortedValues(noteValues);

        const notes1 = pickNotes({
            noteValues,
            sortedValues,
            minSum: 6,
        });
        expect(NUMBER_OF_INPUT_NOTES >= 2).toBe(true);
        expect(notes1.length).toBe(NUMBER_OF_INPUT_NOTES);
        expect(validateSpy).toHaveBeenCalledTimes(1);

        const notes2 = pickNotes({
            noteValues,
            sortedValues,
            minSum: 13,
        });
        expect(notes2.length >= 3).toBe(true);
        expect(validateSpy).toHaveBeenCalledTimes(3);

        const notes3 = pickNotes({
            noteValues,
            sortedValues,
            minSum: 15,
        });
        expect(notes3.length >= 4).toBe(true);
    });

    it('throw error if there is no note combinations >= min sum', () => {
        expectErrorResponse(() => pickNotes({
            noteValues: {
                0: ['n:0'],
                10: ['n:1'],
                100: ['n:2'],
            },
            sortedValues: [0, 10, 100],
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
            sortedValues: [2, 5],
            minSum: 6,
            numberOfNotes: 3,
        })).toEqual([
            {
                key: 'n:1',
                value: 2,
            },
            {
                key: 'n:0',
                value: 5,
            },
        ].sort());
    });

    it('throw error if total number of notes is less than required numberOfNotes and allowLessNumberOfNotes is false', () => {
        expectErrorResponse(() => pickNotes({
            noteValues: {
                2: ['n:1'],
                5: ['n:0'],
            },
            sortedValues: [2, 5],
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

        const noteValues = {
            1: ['n:0', 'n:1', 'n:2', 'n:3', 'n:4'],
            2: ['n:5', 'n:6'],
            3: ['n:7'],
        };
        const sortedValues = generateSortedValues(noteValues);

        pickNotes({
            noteValues,
            sortedValues,
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

        const noteValues = {
            1: ['n:0', 'n:1', 'n:2', 'n:3', 'n:4'],
            2: ['n:5', 'n:6'],
            3: ['n:7'],
        };
        const sortedValues = generateSortedValues(noteValues);

        pickNotes({
            noteValues,
            sortedValues,
            minSum: 4,
            numberOfNotes: 3,
        });

        expect(pickValuesSpy).toHaveBeenCalledTimes(2);
        expect(pickValuesSpy.mock.calls[1][2]).toEqual(3);

        pickValuesSpy.mockRestore();
    });
});
